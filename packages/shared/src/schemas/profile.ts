import { z } from 'zod';

/**
 * Request body for PATCH /profile.
 * Mirrors the backend updateProfileSchema exactly, including the refine rule:
 * newPassword requires currentPassword to be present.
 */
export const updateProfileSchema = z
  .object({
    avatarUrl: z.string().url('Некорректный URL').nullable().optional(),
    currentPassword: z.string().min(1, 'Введите текущий пароль').optional(),
    newPassword: z
      .string()
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .max(72, 'Пароль не может превышать 72 символа')
      .optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: 'currentPassword обязателен при смене пароля',
    path: ['currentPassword'],
  });

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
