import { DayScheduleDto } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class SchedulesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    getMySchedule(userId: string): Promise<{
        id: string;
        companyId: string;
        userId: string;
        weekday: import(".prisma/client").$Enums.Weekday;
        isWorkingDay: boolean;
        startTime: string | null;
        endTime: string | null;
        autoCheckoutBuffer: number;
    }[]>;
    getUserSchedule(userId: string): Promise<{
        id: string;
        companyId: string;
        userId: string;
        weekday: import(".prisma/client").$Enums.Weekday;
        isWorkingDay: boolean;
        startTime: string | null;
        endTime: string | null;
        autoCheckoutBuffer: number;
    }[]>;
    saveSchedule(userId: string, days: DayScheduleDto[], actorId: string): Promise<{
        id: string;
        companyId: string;
        userId: string;
        weekday: import(".prisma/client").$Enums.Weekday;
        isWorkingDay: boolean;
        startTime: string | null;
        endTime: string | null;
        autoCheckoutBuffer: number;
    }[]>;
    applyAll(days: DayScheduleDto[], actorId: string, userIds?: string[]): Promise<{
        applied: number;
    }>;
    private validateMinHours;
}
