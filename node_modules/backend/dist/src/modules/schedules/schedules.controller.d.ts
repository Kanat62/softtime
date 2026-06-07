import { z } from 'zod';
import { SchedulesService } from './schedules.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const SaveScheduleBodyDto_base: import("nestjs-zod").ZodDto<{
    days: {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        autoCheckoutBuffer: number;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
    }[];
}, z.ZodObjectDef<{
    days: z.ZodArray<z.ZodEffects<z.ZodObject<{
        weekday: z.ZodNativeEnum<typeof import("@softtime/shared").Weekday>;
        isWorkingDay: z.ZodBoolean;
        startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        autoCheckoutBuffer: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        autoCheckoutBuffer: number;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
    }, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        autoCheckoutBuffer?: number | undefined;
    }>, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        autoCheckoutBuffer: number;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
    }, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        autoCheckoutBuffer?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny>, {
    days: {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        autoCheckoutBuffer?: number | undefined;
    }[];
}>;
declare class SaveScheduleBodyDto extends SaveScheduleBodyDto_base {
}
declare const ApplyAllBodyDto_base: import("nestjs-zod").ZodDto<{
    days: {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        autoCheckoutBuffer: number;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
    }[];
    userIds?: string[] | undefined;
}, z.ZodObjectDef<{
    days: z.ZodArray<z.ZodEffects<z.ZodObject<{
        weekday: z.ZodNativeEnum<typeof import("@softtime/shared").Weekday>;
        isWorkingDay: z.ZodBoolean;
        startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        autoCheckoutBuffer: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        autoCheckoutBuffer: number;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
    }, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        autoCheckoutBuffer?: number | undefined;
    }>, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        autoCheckoutBuffer: number;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
    }, {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        autoCheckoutBuffer?: number | undefined;
    }>, "many">;
    userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny>, {
    days: {
        weekday: import("@softtime/shared").Weekday;
        isWorkingDay: boolean;
        startTime?: string | null | undefined;
        endTime?: string | null | undefined;
        autoCheckoutBuffer?: number | undefined;
    }[];
    userIds?: string[] | undefined;
}>;
declare class ApplyAllBodyDto extends ApplyAllBodyDto_base {
}
export declare class SchedulesController {
    private readonly schedulesService;
    constructor(schedulesService: SchedulesService);
    getMySchedule(user: TenantPayload): Promise<{
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
    saveSchedule(userId: string, body: SaveScheduleBodyDto, user: TenantPayload): Promise<{
        id: string;
        companyId: string;
        userId: string;
        weekday: import(".prisma/client").$Enums.Weekday;
        isWorkingDay: boolean;
        startTime: string | null;
        endTime: string | null;
        autoCheckoutBuffer: number;
    }[]>;
    applyAll(body: ApplyAllBodyDto, user: TenantPayload): Promise<{
        applied: number;
    }>;
}
export {};
