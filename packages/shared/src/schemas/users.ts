import { z } from 'zod';

/** Смена статуса пользователя — тело PATCH /users/:id/status */
export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED', 'WARNING'], {
    errorMap: () => ({ message: 'Допустимые статусы: ACTIVE, BLOCKED, WARNING' }),
  }),
});

/** Сохранение admin-комментария — тело PATCH /users/:id/note */
export const updateUserNoteSchema = z.object({
  note: z.string().max(1000, 'Комментарий не может превышать 1000 символов'),
});

/** Обновление профиля — тело PATCH /profile */
export const updateProfileSchema = z
  .object({
    avatarUrl: z.string().url('Некорректный URL').nullable().optional(),
    currentPassword: z.string().min(1).optional(),
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

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserNoteDto = z.infer<typeof updateUserNoteSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
