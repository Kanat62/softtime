import { z } from 'zod';
import { DayStatus } from '../enums';

/** QR-токен для check-in / check-out — тело POST /attendance/check-in|check-out */
export const checkInOutSchema = z.object({
  qrToken: z.string().min(1, 'qrToken обязателен'),
});

/** Ручное создание записи посещаемости — тело POST /attendance/manual */
export const manualAttendanceSchema = z.object({
  userId: z.string().uuid('Некорректный UUID пользователя'),
  date: z.string().date('Формат даты: YYYY-MM-DD'),
  status: z.nativeEnum(DayStatus, {
    errorMap: () => ({ message: 'Недопустимый статус дня' }),
  }),
  checkInAt: z.string().datetime().nullable().optional(),
  checkOutAt: z.string().datetime().nullable().optional(),
  note: z.string().max(500, 'Заметка не может превышать 500 символов').optional(),
});

/** Правка существующей записи посещаемости — тело PATCH /attendance/:id */
export const patchAttendanceSchema = z
  .object({
    checkInAt: z.string().datetime().nullable().optional(),
    checkOutAt: z.string().datetime().nullable().optional(),
    status: z.nativeEnum(DayStatus).optional(),
    note: z.string().max(500, 'Заметка не может превышать 500 символов').optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Нет данных для обновления',
  });

export type CheckInOutDto = z.infer<typeof checkInOutSchema>;
export type ManualAttendanceDto = z.infer<typeof manualAttendanceSchema>;
export type PatchAttendanceDto = z.infer<typeof patchAttendanceSchema>;
