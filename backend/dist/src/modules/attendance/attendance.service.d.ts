import { CheckInStatus, CheckOutStatus, DayStatus, Weekday } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare function startOfDayUtc(d: Date): Date;
export declare function getWeekdayFromDate(d: Date): Weekday;
export declare function calcCheckInStatus(nowMinutes: number, startMinutes: number): CheckInStatus;
export declare function calcCheckOutStatus(nowMinutes: number, endMinutes: number): CheckOutStatus;
export declare function calcDayStatus(checkInStatus: string, checkOutStatus: string): DayStatus;
export declare class AttendanceService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private validateQrAndIp;
    checkIn(userId: string, qrToken: string, ip: string): Promise<{
        record: any;
        checkInStatus: CheckInStatus;
        diffMinutes: number;
        message: string;
    }>;
    checkOut(userId: string, qrToken: string, ip: string): Promise<{
        record: {
            status: import(".prisma/client").$Enums.DayStatus;
            id: string;
            companyId: string;
            userId: string;
            date: Date;
            checkInAt: Date | null;
            checkOutAt: Date | null;
            checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
            checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
            workedMinutes: number | null;
            isManual: boolean;
            note: string | null;
        };
        checkOutStatus: CheckOutStatus;
        dayStatus: DayStatus;
        workedMinutes: number;
        message: string;
    }>;
    getMyHistory(userId: string, query: {
        from?: string;
        to?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            status: import(".prisma/client").$Enums.DayStatus;
            id: string;
            companyId: string;
            userId: string;
            date: Date;
            checkInAt: Date | null;
            checkOutAt: Date | null;
            checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
            checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
            workedMinutes: number | null;
            isManual: boolean;
            note: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getTodayInOffice(): Promise<{
        status: import(".prisma/client").$Enums.DayStatus;
        id: string;
        companyId: string;
        userId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
        checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
        workedMinutes: number | null;
        isManual: boolean;
        note: string | null;
    }[]>;
    getCompanyAttendance(query: {
        from?: string;
        to?: string;
        userId?: string;
        status?: DayStatus;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            status: import(".prisma/client").$Enums.DayStatus;
            id: string;
            companyId: string;
            userId: string;
            date: Date;
            checkInAt: Date | null;
            checkOutAt: Date | null;
            checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
            checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
            workedMinutes: number | null;
            isManual: boolean;
            note: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    patchAttendance(id: string, dto: {
        checkInAt?: string | null;
        checkOutAt?: string | null;
        status?: DayStatus;
        note?: string;
    }, actorId: string): Promise<{
        status: import(".prisma/client").$Enums.DayStatus;
        id: string;
        companyId: string;
        userId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
        checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
        workedMinutes: number | null;
        isManual: boolean;
        note: string | null;
    }>;
    createManual(dto: {
        userId: string;
        date: string;
        status: DayStatus;
        checkInAt?: string | null;
        checkOutAt?: string | null;
        note?: string;
    }, actorId: string): Promise<{
        status: import(".prisma/client").$Enums.DayStatus;
        id: string;
        companyId: string;
        userId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
        checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
        workedMinutes: number | null;
        isManual: boolean;
        note: string | null;
    }>;
}
