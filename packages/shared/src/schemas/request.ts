import { z } from 'zod';
import { RequestType } from '../enums';

/** Схема заявки сотрудника (отсутствие или ранний уход) */
export const absenceRequestSchema = z.object({
  type: z.nativeEnum(RequestType, {
    errorMap: () => ({ message: 'validation:enumValue.requestType' }),
  }),
  startDate: z.coerce.date({
    errorMap: () => ({ message: 'validation:format.startDate' }),
  }),
  /** Дата окончания — обязательна для многодневного отсутствия, не нужна для раннего ухода */
  endDate: z.coerce.date().nullable().optional(),
  /** Желаемое время ухода для заявки типа EARLY_LEAVE, формат "HH:mm" */
  desiredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'validation:format.time')
    .nullable()
    .optional(),
  comment: z.string().nullable().optional(),
});

/** Схема отклонения заявки — тело PATCH /requests/:id/reject */
export const rejectRequestSchema = z.object({
  decisionNote: z.string().max(500, 'validation:length.commentMax500').optional(),
});

export type AbsenceRequestDto = z.infer<typeof absenceRequestSchema>;
export type RejectRequestDto = z.infer<typeof rejectRequestSchema>;
