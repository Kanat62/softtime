import { z } from 'zod';

/** Смена статуса пользователя — тело PATCH /users/:id/status */
export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED', 'WARNING'], {
    errorMap: () => ({ message: 'validation:enumValue.userStatus' }),
  }),
});

/** Сохранение admin-комментария — тело PATCH /users/:id/note */
export const updateUserNoteSchema = z.object({
  note: z.string().max(1000, 'validation:length.commentMax1000'),
});

/** Обновление профиля — тело PATCH /profile */
export const updateProfileSchema = z
  .object({
    avatarUrl: z.string().url('validation:format.url').nullable().optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z
      .string()
      .min(8, 'validation:password.min')
      .max(72, 'validation:password.max')
      .optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: 'validation:password.currentRequired',
    path: ['currentPassword'],
  });

/** Удаление своего аккаунта — тело DELETE /users/me (подтверждение паролем) */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'validation:required.password'),
});

export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserNoteDto = z.infer<typeof updateUserNoteSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
