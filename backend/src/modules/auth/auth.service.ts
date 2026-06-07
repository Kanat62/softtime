import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  UserStatus,
  CompanyStatus,
  SubStatus,
  RegisterCompanyDto,
  RegisterWorkerDto,
  LoginDto,
} from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';

const BCRYPT_ROUNDS = 12;
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '30d';
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const TRIAL_PERIOD_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly maxAttempts: number;
  private readonly blockSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    this.maxAttempts = config.get<number>('BRUTE_FORCE_MAX_ATTEMPTS', 5);
    this.blockSeconds = config.get<number>('BRUTE_FORCE_BLOCK_MINUTES', 15) * 60;
  }

  // ─── register/company ───────────────────────────────────────────────────────

  async registerCompany(dto: RegisterCompanyDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const companyCode = this.generateCompanyCode();

    const { company, user } = await (this.prisma.$transaction as any)(
      async (tx: any) => {
        const company = await tx.company.create({
          data: {
            name: dto.companyName,
            companyCode,
            status: CompanyStatus.TRIAL,
          },
        });

        const existingUser = await tx.user.findFirst({
          where: { companyId: company.id, email: dto.email },
        });
        if (existingUser) {
          throw new ConflictException('Email уже используется в этой компании');
        }

        const user = await tx.user.create({
          data: {
            companyId: company.id,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            fullName: dto.fullName,
            email: dto.email,
            passwordHash,
          },
        });

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + TRIAL_PERIOD_DAYS);

        await tx.subscription.create({
          data: {
            companyId: company.id,
            status: SubStatus.TRIAL,
            periodStart: now,
            periodEnd,
            priceUsd: 30,
          },
        });

        await tx.workSettings.create({
          data: {
            companyId: company.id,
            minWorkdayHours: 6,
            defaultCheckoutBuffer: 60,
          },
        });

        return { company, user };
      },
    );

    // Push event 8b: Новая компания зарегистрирована → PROVIDER
    // Route is @Public — no tenant context → extension is no-op → $queryRaw in sendToProviders works.
    void this.notifications.sendToProviders(
      'Новая компания',
      `Компания «${company.name}» зарегистрировалась на платформе`,
    );

    const tokens = await this.generateTokens(user.id, UserRole.ADMIN, company.id, user.status);
    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ─── register/worker ────────────────────────────────────────────────────────

  async registerWorker(dto: RegisterWorkerDto) {
    const company = await this.prisma.company.findUnique({
      where: { companyCode: dto.companyCode },
    });
    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { companyId: company.id, email: dto.email, deletedAt: null },
    });
    if (existingUser) {
      throw new ConflictException('Email уже используется в этой компании');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        companyId: company.id,
        role: UserRole.WORKER,
        status: UserStatus.PENDING,
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
      },
    });

    // Push event 1: Новый сотрудник ждёт подтверждения → ADMIN
    // Route is @Public — no tenant context → sendToCompanyAdmins with explicit companyId works.
    void this.notifications.sendToCompanyAdmins(
      company.id,
      'Новый сотрудник',
      `${dto.fullName} ожидает подтверждения регистрации`,
    );

    const tokens = await this.generateTokens(user.id, UserRole.WORKER, company.id, user.status);
    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ─── login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip: string) {
    const bruteKey = `bf:${dto.email}:${ip}`;

    const attempts = await this.redis.get(bruteKey);
    if (attempts && parseInt(attempts, 10) >= this.maxAttempts) {
      throw new HttpException(
        'Слишком много попыток. Повторите через 15 минут.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    const isValid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!isValid) {
      const count = await this.redis.incr(bruteKey);
      if (count === 1) {
        await this.redis.expire(bruteKey, this.blockSeconds);
      }
      throw new UnauthorizedException('Неверный email или пароль');
    }

    await this.redis.del(bruteKey);

    const tokens = await this.generateTokens(
      user!.id,
      user!.role,
      user!.companyId,
      user!.status,
    );
    return {
      ...tokens,
      user: this.sanitizeUser(user!),
    };
  }

  // ─── refresh ────────────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    let payload: { sub: string; tokenId: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    const { sub: userId, tokenId } = payload;
    const redisKey = `refresh:${userId}:${tokenId}`;

    const stored = await this.redis.get(redisKey);
    if (!stored) {
      throw new UnauthorizedException('Refresh-токен не найден или истёк');
    }

    await this.redis.del(redisKey);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const tokens = await this.generateTokens(user.id, user.role, user.companyId, user.status);
    return tokens;
  }

  // ─── logout ─────────────────────────────────────────────────────────────────

  async logout(userId: string, fcmToken?: string) {
    const refreshKeys = await this.redis.keys(`refresh:${userId}:*`);
    if (refreshKeys.length) {
      await this.redis.del(...refreshKeys);
    }

    if (fcmToken) {
      await this.prisma.deviceToken.deleteMany({
        where: { userId, fcmToken },
      });
    }
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async generateTokens(
    userId: string,
    role: string,
    companyId: string | null,
    status?: string,
  ) {
    const tokenId = uuidv4();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, role, companyId, status },
        {
          secret: this.config.get<string>('JWT_SECRET'),
          expiresIn: ACCESS_EXPIRES,
        },
      ),
      this.jwt.signAsync(
        { sub: userId, tokenId, type: 'refresh' },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: REFRESH_EXPIRES,
        },
      ),
    ]);

    await this.redis.set(
      `refresh:${userId}:${tokenId}`,
      '1',
      REFRESH_TTL_SECONDS,
    );

    return { accessToken, refreshToken };
  }

  private generateCompanyCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
  }

  private sanitizeUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    companyId: string | null;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
    };
  }
}
