import { z } from 'zod';
import { AuthService } from './auth.service';
declare const RegisterCompanyDto_base: import("nestjs-zod").ZodDto<{
    companyName: string;
    fullName: string;
    email: string;
    password: string;
}, z.ZodObjectDef<{
    companyName: z.ZodString;
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
}>;
declare class RegisterCompanyDto extends RegisterCompanyDto_base {
}
declare const RegisterWorkerDto_base: import("nestjs-zod").ZodDto<{
    fullName: string;
    email: string;
    password: string;
    companyCode: string;
}, z.ZodObjectDef<{
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    companyCode: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    fullName: string;
    email: string;
    password: string;
    companyCode: string;
}>;
declare class RegisterWorkerDto extends RegisterWorkerDto_base {
}
declare const LoginDto_base: import("nestjs-zod").ZodDto<{
    email: string;
    password: string;
}, z.ZodObjectDef<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    email: string;
    password: string;
}>;
declare class LoginDto extends LoginDto_base {
}
declare const RefreshDto_base: import("nestjs-zod").ZodDto<{
    refreshToken: string;
}, z.ZodObjectDef<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    refreshToken: string;
}>;
declare class RefreshDto extends RefreshDto_base {
}
declare const LogoutDto_base: import("nestjs-zod").ZodDto<{
    fcmToken?: string | undefined;
}, z.ZodObjectDef<{
    fcmToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    fcmToken?: string | undefined;
}>;
declare class LogoutDto extends LogoutDto_base {
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    registerCompany(dto: RegisterCompanyDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            status: string;
            companyId: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    registerWorker(dto: RegisterWorkerDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            status: string;
            companyId: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto, req: any): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            status: string;
            companyId: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: {
        userId: string;
    }, dto: LogoutDto): Promise<void>;
}
export {};
