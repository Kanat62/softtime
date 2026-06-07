"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../common/redis/redis.service");
const notifications_service_1 = require("../notifications/notifications.service");
const BCRYPT_ROUNDS = 12;
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '30d';
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const TRIAL_PERIOD_DAYS = 30;
let AuthService = class AuthService {
    constructor(prisma, jwt, redis, config, notifications) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.redis = redis;
        this.config = config;
        this.notifications = notifications;
        this.maxAttempts = config.get('BRUTE_FORCE_MAX_ATTEMPTS', 5);
        this.blockSeconds = config.get('BRUTE_FORCE_BLOCK_MINUTES', 15) * 60;
    }
    async registerCompany(dto) {
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const companyCode = this.generateCompanyCode();
        const { company, user } = await this.prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: dto.companyName,
                    companyCode,
                    status: shared_1.CompanyStatus.TRIAL,
                },
            });
            const existingUser = await tx.user.findFirst({
                where: { companyId: company.id, email: dto.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Email уже используется в этой компании');
            }
            const user = await tx.user.create({
                data: {
                    companyId: company.id,
                    role: shared_1.UserRole.ADMIN,
                    status: shared_1.UserStatus.ACTIVE,
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
                    status: shared_1.SubStatus.TRIAL,
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
        });
        void this.notifications.sendToProviders('Новая компания', `Компания «${company.name}» зарегистрировалась на платформе`);
        const tokens = await this.generateTokens(user.id, shared_1.UserRole.ADMIN, company.id, user.status);
        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    async registerWorker(dto) {
        const company = await this.prisma.company.findUnique({
            where: { companyCode: dto.companyCode },
        });
        if (!company) {
            throw new common_1.NotFoundException('Компания не найдена');
        }
        const existingUser = await this.prisma.user.findFirst({
            where: { companyId: company.id, email: dto.email, deletedAt: null },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email уже используется в этой компании');
        }
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                companyId: company.id,
                role: shared_1.UserRole.WORKER,
                status: shared_1.UserStatus.PENDING,
                fullName: dto.fullName,
                email: dto.email,
                passwordHash,
            },
        });
        void this.notifications.sendToCompanyAdmins(company.id, 'Новый сотрудник', `${dto.fullName} ожидает подтверждения регистрации`);
        const tokens = await this.generateTokens(user.id, shared_1.UserRole.WORKER, company.id, user.status);
        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    async login(dto, ip) {
        const bruteKey = `bf:${dto.email}:${ip}`;
        const attempts = await this.redis.get(bruteKey);
        if (attempts && parseInt(attempts, 10) >= this.maxAttempts) {
            throw new common_1.HttpException('Слишком много попыток. Повторите через 15 минут.', common_1.HttpStatus.TOO_MANY_REQUESTS);
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
            throw new common_1.UnauthorizedException('Неверный email или пароль');
        }
        await this.redis.del(bruteKey);
        const tokens = await this.generateTokens(user.id, user.role, user.companyId, user.status);
        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Недействительный refresh-токен');
        }
        const { sub: userId, tokenId } = payload;
        const redisKey = `refresh:${userId}:${tokenId}`;
        const stored = await this.redis.get(redisKey);
        if (!stored) {
            throw new common_1.UnauthorizedException('Refresh-токен не найден или истёк');
        }
        await this.redis.del(redisKey);
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Пользователь не найден');
        }
        const tokens = await this.generateTokens(user.id, user.role, user.companyId, user.status);
        return tokens;
    }
    async logout(userId, fcmToken) {
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
    async generateTokens(userId, role, companyId, status) {
        const tokenId = (0, uuid_1.v4)();
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync({ sub: userId, role, companyId, status }, {
                secret: this.config.get('JWT_SECRET'),
                expiresIn: ACCESS_EXPIRES,
            }),
            this.jwt.signAsync({ sub: userId, tokenId, type: 'refresh' }, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: REFRESH_EXPIRES,
            }),
        ]);
        await this.redis.set(`refresh:${userId}:${tokenId}`, '1', REFRESH_TTL_SECONDS);
        return { accessToken, refreshToken };
    }
    generateCompanyCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            status: user.status,
            companyId: user.companyId,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        redis_service_1.RedisService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map