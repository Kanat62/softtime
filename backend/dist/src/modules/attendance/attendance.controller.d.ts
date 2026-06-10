import { z } from 'zod';
import { DayStatus } from '@softtime/shared';
import { AttendanceService } from './attendance.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const CheckInOutDto_base: import("nestjs-zod").ZodDto<{
    qrToken: string;
}, z.ZodObjectDef<{
    qrToken: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    qrToken: string;
}>;
declare class CheckInOutDto extends CheckInOutDto_base {
}
declare const AttendanceMeQueryDto_base: import("nestjs-zod").ZodDto<{
    page: number;
    limit: number;
    from?: string | undefined;
    to?: string | undefined;
}, z.ZodObjectDef<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    from?: string | undefined;
    to?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
declare class AttendanceMeQueryDto extends AttendanceMeQueryDto_base {
}
declare const AttendanceQueryDto_base: import("nestjs-zod").ZodDto<{
    page: number;
    limit: number;
    status?: DayStatus | undefined;
    userId?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
}, z.ZodObjectDef<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof DayStatus>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status?: DayStatus | undefined;
    userId?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
declare class AttendanceQueryDto extends AttendanceQueryDto_base {
}
declare const PatchAttendanceDto_base: import("nestjs-zod").ZodDto<{
    status?: DayStatus | undefined;
    checkInAt?: string | null | undefined;
    checkOutAt?: string | null | undefined;
    note?: string | undefined;
}, z.ZodEffectsDef<z.ZodObject<{
    checkInAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    checkOutAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof DayStatus>>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: DayStatus | undefined;
    checkInAt?: string | null | undefined;
    checkOutAt?: string | null | undefined;
    note?: string | undefined;
}, {
    status?: DayStatus | undefined;
    checkInAt?: string | null | undefined;
    checkOutAt?: string | null | undefined;
    note?: string | undefined;
}>>, {
    status?: DayStatus | undefined;
    checkInAt?: string | null | undefined;
    checkOutAt?: string | null | undefined;
    note?: string | undefined;
}>;
declare class PatchAttendanceDto extends PatchAttendanceDto_base {
}
declare const ManualAttendanceDto_base: import("nestjs-zod").ZodDto<{
    status: DayStatus;
    date: string;
    userId: string;
    checkInAt?: string | null | undefined;
    checkOutAt?: string | null | undefined;
    note?: string | undefined;
}, z.ZodObjectDef<{
    userId: z.ZodString;
    date: z.ZodString;
    status: z.ZodNativeEnum<typeof DayStatus>;
    checkInAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    checkOutAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    status: DayStatus;
    date: string;
    userId: string;
    checkInAt?: string | null | undefined;
    checkOutAt?: string | null | undefined;
    note?: string | undefined;
}>;
declare class ManualAttendanceDto extends ManualAttendanceDto_base {
}
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(body: CheckInOutDto, user: TenantPayload, req: any): Promise<{
        record: any;
        checkInStatus: import("@softtime/shared").CheckInStatus;
        diffMinutes: number;
        message: string;
    }>;
    checkOut(body: CheckInOutDto, user: TenantPayload, req: any): Promise<{
        record: {
            status: import(".prisma/client").$Enums.DayStatus;
            date: Date;
            id: string;
            companyId: string;
            userId: string;
            checkInAt: Date | null;
            checkOutAt: Date | null;
            checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
            checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
            workedMinutes: number | null;
            isManual: boolean;
            note: string | null;
        };
        checkOutStatus: import("@softtime/shared").CheckOutStatus;
        dayStatus: DayStatus;
        workedMinutes: number;
        message: string;
    }>;
    getMyHistory(query: AttendanceMeQueryDto, user: TenantPayload): Promise<{
        data: {
            status: import(".prisma/client").$Enums.DayStatus;
            date: Date;
            id: string;
            companyId: string;
            userId: string;
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
    createManual(body: ManualAttendanceDto, user: TenantPayload): Promise<{
        status: import(".prisma/client").$Enums.DayStatus;
        date: Date;
        id: string;
        companyId: string;
        userId: string;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
        checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
        workedMinutes: number | null;
        isManual: boolean;
        note: string | null;
    }>;
    getTodayInOffice(): Promise<{
        status: import(".prisma/client").$Enums.DayStatus;
        date: Date;
        id: string;
        companyId: string;
        userId: string;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
        checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
        workedMinutes: number | null;
        isManual: boolean;
        note: string | null;
    }[]>;
    getCompanyAttendance(query: AttendanceQueryDto): Promise<{
        data: {
            status: import(".prisma/client").$Enums.DayStatus;
            date: Date;
            id: string;
            companyId: string;
            userId: string;
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
    patchAttendance(id: string, body: PatchAttendanceDto, user: TenantPayload): Promise<{
        status: import(".prisma/client").$Enums.DayStatus;
        date: Date;
        id: string;
        companyId: string;
        userId: string;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
        checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
        workedMinutes: number | null;
        isManual: boolean;
        note: string | null;
    }>;
}
export {};
