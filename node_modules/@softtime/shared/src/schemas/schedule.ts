import { z } from 'zod';
import { Weekday } from '../enums';

/** Парсит время "HH:mm" в минуты от полуночи */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Схема расписания на один день недели */
export const dayScheduleSchema = z
  .object({
    weekday: z.nativeEnum(Weekday),
    isWorkingDay: z.boolean(),
    /** Время начала смены, формат "HH:mm" */
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
      .nullable()
      .optional(),
    /** Время конца смены, формат "HH:mm" */
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
      .nullable()
      .optional(),
    /** Буфер автозакрытия в минутах, по умолчанию 60 */
    autoCheckoutBuffer: z.number().int().min(0).default(60),
  })
  .superRefine((data, ctx) => {
    if (!data.isWorkingDay) return;

    if (!data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время начала смены обязательно для рабочего дня',
        path: ['startTime'],
      });
      return;
    }

    if (!data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Время конца смены обязательно для рабочего дня',
        path: ['endTime'],
      });
      return;
    }

    const startMinutes = timeToMinutes(data.startTime);
    const endMinutes = timeToMinutes(data.endTime);
    const durationMinutes = endMinutes - startMinutes;

    /** Минимальный рабочий день — 6 часов */
    if (durationMinutes < 6 * 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Рабочий день должен быть не менее 6 часов',
        path: ['endTime'],
      });
    }
  });

/** Схема полного расписания на неделю (7 дней) */
export const scheduleSchema = z.array(dayScheduleSchema).length(7, 'Расписание должно содержать ровно 7 дней');

export type DayScheduleDto = z.infer<typeof dayScheduleSchema>;
export type ScheduleDto = z.infer<typeof scheduleSchema>;
