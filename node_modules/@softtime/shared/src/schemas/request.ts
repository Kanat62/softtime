import { z } from 'zod';
import { RequestType } from '../enums';

/** Схема заявки сотрудника (отсутствие или ранний уход) */
export const absenceRequestSchema = z.object({
  type: z.nativeEnum(RequestType, {
    errorMap: () => ({ message: 'Недопустимый тип заявки' }),
  }),
  startDate: z.coerce.date({
    errorMap: () => ({ message: 'Некорректная дата начала' }),
  }),
  /** Дата окончания — обязательна для многодневного отсутствия, не нужна для раннего ухода */
  endDate: z.coerce.date().nullable().optional(),
  /** Желаемое время ухода для заявки типа EARLY_LEAVE, формат "HH:mm" */
  desiredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
    .nullable()
    .optional(),
  comment: z.string().nullable().optional(),
});

export type AbsenceRequestDto = z.infer<typeof absenceRequestSchema>;
