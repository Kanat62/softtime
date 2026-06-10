"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAllScheduleSchema = exports.scheduleSchema = exports.dayScheduleSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
/** Парсит время "HH:mm" в минуты от полуночи */
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
/** Схема расписания на один день недели */
exports.dayScheduleSchema = zod_1.z
    .object({
    weekday: zod_1.z.nativeEnum(enums_1.Weekday),
    isWorkingDay: zod_1.z.boolean(),
    /** Время начала смены, формат "HH:mm" */
    startTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
        .nullable()
        .optional(),
    /** Время конца смены, формат "HH:mm" */
    endTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
        .nullable()
        .optional(),
    /** Буфер автозакрытия в минутах, по умолчанию 60 */
    autoCheckoutBuffer: zod_1.z.number().int().min(0).default(60),
})
    .superRefine((data, ctx) => {
    if (!data.isWorkingDay)
        return;
    if (!data.startTime) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Время начала смены обязательно для рабочего дня',
            path: ['startTime'],
        });
        return;
    }
    if (!data.endTime) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Время конца смены обязательно для рабочего дня',
            path: ['endTime'],
        });
        return;
    }
    const startMinutes = timeToMinutes(data.startTime);
    const endMinutes = timeToMinutes(data.endTime);
    const durationMinutes = endMinutes - startMinutes;
    /** Минимальный рабочий день — 6 часов */
    if (durationMinutes < 6 * 60) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Рабочий день должен быть не менее 6 часов',
            path: ['endTime'],
        });
    }
});
/** Схема полного расписания на неделю (7 дней) */
exports.scheduleSchema = zod_1.z.array(exports.dayScheduleSchema).length(7, 'Расписание должно содержать ровно 7 дней');
/** Схема применения расписания ко всем/выбранным сотрудникам — тело POST /schedules/apply-all */
exports.applyAllScheduleSchema = zod_1.z.object({
    days: exports.scheduleSchema,
    /** Если не указан — применяется ко всем сотрудникам компании */
    userIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
//# sourceMappingURL=schedule.js.map