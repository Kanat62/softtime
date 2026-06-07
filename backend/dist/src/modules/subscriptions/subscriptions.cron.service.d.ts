import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SubscriptionsCronService {
    private readonly prisma;
    private readonly notifications;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService, configService: ConfigService);
    checkSubscriptions(): Promise<void>;
}
