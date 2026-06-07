import { z } from 'zod';
import { RequestType } from '../enums';
/** Схема заявки сотрудника (отсутствие или ранний уход) */
export declare const absenceRequestSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof RequestType>;
    startDate: z.ZodDate;
    /** Дата окончания — обязательна для многодневного отсутствия, не нужна для раннего ухода */
    endDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    /** Желаемое время ухода для заявки типа EARLY_LEAVE, формат "HH:mm" */
    desiredTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    comment: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: RequestType;
    startDate: Date;
    endDate?: Date | null | undefined;
    desiredTime?: string | null | undefined;
    comment?: string | null | undefined;
}, {
    type: RequestType;
    startDate: Date;
    endDate?: Date | null | undefined;
    desiredTime?: string | null | undefined;
    comment?: string | null | undefined;
}>;
export type AbsenceRequestDto = z.infer<typeof absenceRequestSchema>;
//# sourceMappingURL=request.d.ts.map