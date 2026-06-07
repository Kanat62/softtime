import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService implements OnModuleInit {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    onModuleInit(): void;
    sendToUser(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
    sendToCompany(companyId: string, role: string | null, title: string, body: string, data?: Record<string, string>): Promise<void>;
    sendToCompanyAdmins(companyId: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
    sendToProviders(title: string, body: string, data?: Record<string, string>): Promise<void>;
    private multicast;
}
