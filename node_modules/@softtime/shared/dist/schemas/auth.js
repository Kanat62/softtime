"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerWorkerSchema = exports.registerCompanySchema = void 0;
const zod_1 = require("zod");
/** Регистрация ADMIN + компании */
exports.registerCompanySchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1, 'Название компании обязательно'),
    fullName: zod_1.z.string().min(1, 'ФИО обязательно'),
    email: zod_1.z.string().email('Некорректный email'),
    password: zod_1.z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(72, 'Пароль не может превышать 72 символа'),
});
/** Регистрация WORKER по коду компании */
exports.registerWorkerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, 'ФИО обязательно'),
    email: zod_1.z.string().email('Некорректный email'),
    password: zod_1.z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(72, 'Пароль не может превышать 72 символа'),
    companyCode: zod_1.z.string().length(6, 'Код компании должен содержать ровно 6 символов'),
});
/** Вход в систему */
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Некорректный email'),
    password: zod_1.z.string().min(1, 'Пароль обязателен'),
});
//# sourceMappingURL=auth.js.map