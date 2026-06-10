import { z } from 'zod';

/** Обновление настроек компании — тело PATCH /settings */
export const patchSettingsSchema = z
  .object({
    minWorkdayHours: z
      .number()
      .int('Должно быть целым числом')
      .min(1, 'Минимум 1 час')
      .max(24, 'Максимум 24 часа')
      .optional(),
    defaultCheckoutBuffer: z
      .number()
      .int('Должно быть целым числом')
      .min(0, 'Не может быть отрицательным')
      .max(480, 'Максимум 480 минут')
      .optional(),
  })
  .refine((d) => d.minWorkdayHours !== undefined || d.defaultCheckoutBuffer !== undefined, {
    message: 'Укажите хотя бы одно поле',
  });

export type PatchSettingsDto = z.infer<typeof patchSettingsSchema>;
