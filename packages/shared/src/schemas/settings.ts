import { z } from 'zod';

/** Обновление настроек компании — тело PATCH /settings */
export const patchSettingsSchema = z
  .object({
    minWorkdayHours: z
      .number()
      .int('validation:settings.integer')
      .min(1, 'validation:settings.minHours')
      .max(24, 'validation:settings.maxHours')
      .optional(),
    defaultCheckoutBuffer: z
      .number()
      .int('validation:settings.integer')
      .min(0, 'validation:settings.notNegative')
      .max(480, 'validation:settings.maxMinutes')
      .optional(),
  })
  .refine((d) => d.minWorkdayHours !== undefined || d.defaultCheckoutBuffer !== undefined, {
    message: 'validation:update.atLeastOneField',
  });

export type PatchSettingsDto = z.infer<typeof patchSettingsSchema>;
