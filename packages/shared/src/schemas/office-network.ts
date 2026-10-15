import { z } from 'zod';

const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const cidrMessageKey = 'validation:format.cidr';

/** Создание офисной сети — тело POST /office-networks */
export const createOfficeNetworkSchema = z.object({
  label: z.string().min(1, 'validation:required.label').max(100, 'validation:length.labelMax100'),
  cidr: z.string().regex(cidrPattern, cidrMessageKey),
});

/** Обновление офисной сети — тело PATCH /office-networks/:id */
export const patchOfficeNetworkSchema = z
  .object({
    label: z.string().min(1).max(100).optional(),
    cidr: z.string().regex(cidrPattern, cidrMessageKey).optional(),
  })
  .refine((d) => d.label !== undefined || d.cidr !== undefined, {
    message: 'validation:update.atLeastOneFieldToUpdate',
  });

export type CreateOfficeNetworkDto = z.infer<typeof createOfficeNetworkSchema>;
export type PatchOfficeNetworkDto = z.infer<typeof patchOfficeNetworkSchema>;
