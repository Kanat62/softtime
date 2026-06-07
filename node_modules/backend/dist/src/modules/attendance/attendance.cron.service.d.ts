import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AttendanceCronService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    autoCloseShifts(): Promise<void>;
    calculateAbsent(): Promise<void>;
    private getEligibleCompanyIds;
}
