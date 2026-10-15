import { z } from 'zod';

/**
 * Request body for PATCH /profile.
 * Mirrors the backend updateProfileSchema exactly, including the refine rule:
 * newPassword requires currentPassword to be present.
 */
export const updateProfileSchema = z
  .object({
    avatarUrl: z.string().url('validation:format.url').nullable().optional(),
    currentPassword: z.string().min(1, 'validation:required.currentPassword').optional(),
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

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
