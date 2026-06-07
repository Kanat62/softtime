import { z } from 'zod';
import { Weekday } from '../enums';
export declare const dayScheduleSchema: z.ZodEffects<z.ZodObject<{
    weekday: z.ZodNativeEnum<typeof Weekday>;
    isWorkingDay: z.ZodBoolean;
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    autoCheckoutBuffer: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    weekday: Weekday;
    isWorkingDay: boolean;
    autoCheckoutBuffer: number;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
}, {
    weekday: Weekday;
    isWorkingDay: boolean;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    autoCheckoutBuffer?: number | undefined;
}>, {
    weekday: Weekday;
    isWorkingDay: boolean;
    autoCheckoutBuffer: number;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
}, {
    weekday: Weekday;
    isWorkingDay: boolean;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    autoCheckoutBuffer?: number | undefined;
}>;
export declare const scheduleSchema: z.ZodArray<z.ZodEffects<z.ZodObject<{
    weekday: z.ZodNativeEnum<typeof Weekday>;
    isWorkingDay: z.ZodBoolean;
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    autoCheckoutBuffer: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    weekday: Weekday;
    isWorkingDay: boolean;
    autoCheckoutBuffer: number;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
}, {
    weekday: Weekday;
    isWorkingDay: boolean;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    autoCheckoutBuffer?: number | undefined;
}>, {
    weekday: Weekday;
    isWorkingDay: boolean;
    autoCheckoutBuffer: number;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
}, {
    weekday: Weekday;
    isWorkingDay: boolean;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    autoCheckoutBuffer?: number | undefined;
}>, "many">;
export type DayScheduleDto = z.infer<typeof dayScheduleSchema>;
export type ScheduleDto = z.infer<typeof scheduleSchema>;
