import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterCompanyDto, RegisterWorkerDto, LoginDto } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly redis;
    private readonly config;
    private readonly notifications;
    private readonly maxAttempts;
    private readonly blockSeconds;
    constructor(prisma: PrismaService, jwt: JwtService, redis: RedisService, config: ConfigService, notifications: NotificationsService);
    registerCompany(dto: RegisterCompanyDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            status: string;
            companyId: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    registerWorker(dto: RegisterWorkerDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            status: string;
            companyId: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto, ip: string): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            status: string;
            companyId: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, fcmToken?: string): Promise<void>;
    private generateTokens;
    private generateCompanyCode;
    private sanitizeUser;
}
