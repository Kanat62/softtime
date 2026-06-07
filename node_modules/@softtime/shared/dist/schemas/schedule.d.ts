import { z } from 'zod';
import { Weekday } from '../enums';
/** Схема расписания на один день недели */
export declare const dayScheduleSchema: z.ZodEffects<z.ZodObject<{
    weekday: z.ZodNativeEnum<typeof Weekday>;
    isWorkingDay: z.ZodBoolean;
    /** Время начала смены, формат "HH:mm" */
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Время конца смены, формат "HH:mm" */
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Буфер автозакрытия в минутах, по умолчанию 60 */
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
/** Схема полного расписания на неделю (7 дней) */
export declare const scheduleSchema: z.ZodArray<z.ZodEffects<z.ZodObject<{
    weekday: z.ZodNativeEnum<typeof Weekday>;
    isWorkingDay: z.ZodBoolean;
    /** Время начала смены, формат "HH:mm" */
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Время конца смены, формат "HH:mm" */
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Буфер автозакрытия в минутах, по умолчанию 60 */
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
//# sourceMappingURL=schedule.d.ts.map