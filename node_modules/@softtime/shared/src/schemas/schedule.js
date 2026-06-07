"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleSchema = exports.dayScheduleSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
exports.dayScheduleSchema = zod_1.z
    .object({
    weekday: zod_1.z.nativeEnum(enums_1.Weekday),
    isWorkingDay: zod_1.z.boolean(),
    startTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
        .nullable()
        .optional(),
    endTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:mm')
        .nullable()
        .optional(),
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
    if (durationMinutes < 6 * 60) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Рабочий день должен быть не менее 6 часов',
            path: ['endTime'],
        });
    }
});
exports.scheduleSchema = zod_1.z.array(exports.dayScheduleSchema).length(7, 'Расписание должно содержать ровно 7 дней');
//# sourceMappingURL=schedule.js.map