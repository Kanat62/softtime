"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.absenceRequestSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
/** Схема заявки сотрудника (отсутствие или ранний уход) */
exports.absenceRequestSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(enums_1.RequestType, {
        errorMap: () => ({ message: 'Недопустимый тип заявки' }),
    }),
    startDate: zod_1.z.coerce.date({
        errorMap: () => ({ message: 'Некорректная дата начала' }),
    }),
    /** Дата окончания — обязательна для многодневного отсутствия, не нужна для раннего ухода */
    endDate: zod_1.z.coerce.date().nullable().optional(),
    /** Желаемое время ухода для заявки типа EARLY_LEAVE, формат "HH:mm" */
    desiredTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
        .nullable()
        .optional(),
    comment: zod_1.z.string().nullable().optional(),
});
//# sourceMappingURL=request.js.map