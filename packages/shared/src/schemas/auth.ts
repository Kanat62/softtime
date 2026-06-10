import { z } from 'zod';

/** Регистрация ADMIN + компании */
export const registerCompanySchema = z.object({
  companyName: z.string().min(1, 'Название компании обязательно'),
  fullName: z.string().min(1, 'ФИО обязательно'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(72, 'Пароль не может превышать 72 символа'),
});

/** Регистрация WORKER по коду компании */
export const registerWorkerSchema = z.object({
  fullName: z.string().min(1, 'ФИО обязательно'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(72, 'Пароль не может превышать 72 символа'),
  companyCode: z.string().regex(/^\d{6}$/, 'Код компании должен содержать ровно 6 цифр'),
});

/** Вход в систему */
export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

/** Обновление токена — тело POST /auth/refresh */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken обязателен'),
});

/** Выход — тело POST /auth/logout */
export const logoutSchema = z.object({
  fcmToken: z.string().optional(),
});

export type RegisterCompanyDto = z.infer<typeof registerCompanySchema>;
export type RegisterWorkerDto = z.infer<typeof registerWorkerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
