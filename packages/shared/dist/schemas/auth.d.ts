import { z } from 'zod';
/** Регистрация ADMIN + компании */
export declare const registerCompanySchema: z.ZodObject<{
    companyName: z.ZodString;
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    email: string;
    companyName: string;
    password: string;
}, {
    fullName: string;
    email: string;
    companyName: string;
    password: string;
}>;
/** Регистрация WORKER по коду компании */
export declare const registerWorkerSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    companyCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    email: string;
    password: string;
    companyCode: string;
}, {
    fullName: string;
    email: string;
    password: string;
    companyCode: string;
}>;
/** Вход в систему */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
/** Обновление токена — тело POST /auth/refresh */
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
/** Выход — тело POST /auth/logout */
export declare const logoutSchema: z.ZodObject<{
    fcmToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fcmToken?: string | undefined;
}, {
    fcmToken?: string | undefined;
}>;
export type RegisterCompanyDto = z.infer<typeof registerCompanySchema>;
export type RegisterWorkerDto = z.infer<typeof registerWorkerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
//# sourceMappingURL=auth.d.ts.map