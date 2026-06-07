import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class SettingsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    getSettings(): Promise<{
        id: string;
        companyId: string;
        minWorkdayHours: number;
        defaultCheckoutBuffer: number;
    }>;
    updateSettings(dto: {
        minWorkdayHours?: number;
        defaultCheckoutBuffer?: number;
    }, actorId: string): Promise<{
        id: string;
        companyId: string;
        minWorkdayHours: number;
        defaultCheckoutBuffer: number;
    }>;
}
