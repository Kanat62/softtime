import { z } from 'zod';

const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const cidrMessage = 'Некорректный CIDR или IP (пример: 192.168.1.0/24)';

/** Создание офисной сети — тело POST /office-networks */
export const createOfficeNetworkSchema = z.object({
  label: z.string().min(1, 'Название обязательно').max(100, 'Название не может превышать 100 символов'),
  cidr: z.string().regex(cidrPattern, cidrMessage),
});

/** Обновление офисной сети — тело PATCH /office-networks/:id */
export const patchOfficeNetworkSchema = z
  .object({
    label: z.string().min(1).max(100).optional(),
    cidr: z.string().regex(cidrPattern, cidrMessage).optional(),
  })
  .refine((d) => d.label !== undefined || d.cidr !== undefined, {
    message: 'Укажите хотя бы одно поле для обновления',
  });

export type CreateOfficeNetworkDto = z.infer<typeof createOfficeNetworkSchema>;
export type PatchOfficeNetworkDto = z.infer<typeof patchOfficeNetworkSchema>;
