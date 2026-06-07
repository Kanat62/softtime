import { z } from 'zod';
export declare const registerCompanySchema: z.ZodObject<{
    companyName: z.ZodString;
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
}, {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
}>;
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
export type RegisterCompanyDto = z.infer<typeof registerCompanySchema>;
export type RegisterWorkerDto = z.infer<typeof registerWorkerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
