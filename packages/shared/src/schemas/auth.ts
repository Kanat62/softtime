import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../locales';

/**
 * Язык интерфейса, который клиент сообщает при регистрации.
 *
 * Опционально и обратно совместимо: нет поля → в БД останется DEFAULT 'ru'.
 * Нужно именно на регистрации, потому что PENDING-пользователь не может
 * позвать PATCH /users/me/language — его режет StatusGuard, а push
 * «регистрация одобрена/отклонена» приходит ему ещё до активации.
 */
export const languageSchema = z.enum(SUPPORTED_LANGUAGES);

/** Регистрация ADMIN + компании */
export const registerCompanySchema = z.object({
  companyName: z.string().min(1, 'validation:required.companyName'),
  fullName: z.string().min(1, 'validation:required.fullName'),
  email: z.string().email('validation:format.email'),
  password: z.string().min(8, 'validation:password.min').max(72, 'validation:password.max'),
  language: languageSchema.optional(),
});

/** Регистрация WORKER по коду компании */
export const registerWorkerSchema = z.object({
  fullName: z.string().min(1, 'validation:required.fullName'),
  email: z.string().email('validation:format.email'),
  password: z.string().min(8, 'validation:password.min').max(72, 'validation:password.max'),
  companyCode: z.string().regex(/^\d{6}$/, 'validation:format.companyCode'),
  language: languageSchema.optional(),
});

/** Вход в систему */
export const loginSchema = z.object({
  email: z.string().email('validation:format.email'),
  password: z.string().min(1, 'validation:required.password'),
});

/** Обновление токена — тело POST /auth/refresh */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'validation:required.refreshToken'),
});

/** Выход — тело POST /auth/logout */
export const logoutSchema = z.object({
  fcmToken: z.string().optional(),
});

/** Смена языка — тело PATCH /users/me/language */
export const updateLanguageSchema = z.object({
  language: languageSchema,
});

export type UpdateLanguageDto = z.infer<typeof updateLanguageSchema>;
export type RegisterCompanyDto = z.infer<typeof registerCompanySchema>;
export type RegisterWorkerDto = z.infer<typeof registerWorkerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
