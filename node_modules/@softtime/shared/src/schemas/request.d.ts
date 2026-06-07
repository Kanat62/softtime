import { z } from 'zod';
import { RequestType } from '../enums';
export declare const absenceRequestSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof RequestType>;
    startDate: z.ZodDate;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
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
