"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const shared_1 = require("@softtime/shared");
const attendance_service_1 = require("./attendance.service");
const decorators_1 = require("../../common/decorators");
const company_active_guard_1 = require("../../common/guards/company-active.guard");
const checkInOutSchema = zod_1.z.object({
    qrToken: zod_1.z.string().min(1, 'qrToken обязателен'),
});
const attendanceMeQuerySchema = zod_1.z.object({
    from: zod_1.z.string().date().optional(),
    to: zod_1.z.string().date().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(30),
});
const attendanceQuerySchema = zod_1.z.object({
    from: zod_1.z.string().date().optional(),
    to: zod_1.z.string().date().optional(),
    userId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(shared_1.DayStatus).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
});
const patchAttendanceSchema = zod_1.z
    .object({
    checkInAt: zod_1.z.string().datetime().nullable().optional(),
    checkOutAt: zod_1.z.string().datetime().nullable().optional(),
    status: zod_1.z.nativeEnum(shared_1.DayStatus).optional(),
    note: zod_1.z.string().max(500).optional(),
})
    .refine((d) => Object.keys(d).some((k) => d[k] !== undefined), {
    message: 'Нет данных для обновления',
});
const manualAttendanceSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    date: zod_1.z.string().date(),
    status: zod_1.z.nativeEnum(shared_1.DayStatus),
    checkInAt: zod_1.z.string().datetime().nullable().optional(),
    checkOutAt: zod_1.z.string().datetime().nullable().optional(),
    note: zod_1.z.string().max(500).optional(),
});
class CheckInOutDto extends (0, nestjs_zod_1.createZodDto)(checkInOutSchema) {
}
class AttendanceMeQueryDto extends (0, nestjs_zod_1.createZodDto)(attendanceMeQuerySchema) {
}
class AttendanceQueryDto extends (0, nestjs_zod_1.createZodDto)(attendanceQuerySchema) {
}
class PatchAttendanceDto extends (0, nestjs_zod_1.createZodDto)(patchAttendanceSchema) {
}
class ManualAttendanceDto extends (0, nestjs_zod_1.createZodDto)(manualAttendanceSchema) {
}
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    checkIn(body, user, req) {
        const ip = extractIp(req);
        return this.attendanceService.checkIn(user.userId, body.qrToken, ip);
    }
    checkOut(body, user, req) {
        const ip = extractIp(req);
        return this.attendanceService.checkOut(user.userId, body.qrToken, ip);
    }
    getMyHistory(query, user) {
        return this.attendanceService.getMyHistory(user.userId, query);
    }
    createManual(body, user) {
        return this.attendanceService.createManual(body, user.userId);
    }
    getTodayInOffice() {
        return this.attendanceService.getTodayInOffice();
    }
    getCompanyAttendance(query) {
        return this.attendanceService.getCompanyAttendance(query);
    }
    patchAttendance(id, body, user) {
        return this.attendanceService.patchAttendance(id, body, user.userId);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, common_1.UseGuards)(company_active_guard_1.CompanyActiveGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Отметить приход (QR + IP проверка)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckInOutDto, Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    (0, common_1.UseGuards)(company_active_guard_1.CompanyActiveGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Отметить уход (QR + IP проверка)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckInOutDto, Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Своя история посещаемости (WORKER + ADMIN)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, example: '2026-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, example: '2026-12-31' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AttendanceMeQueryDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getMyHistory", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать запись вручную (ADMIN), isManual = true' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ManualAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createManual", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Кто сейчас в офисе (checkIn без checkOut)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getTodayInOffice", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Посещаемость компании (ADMIN, фильтры + пагинация)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: shared_1.DayStatus }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AttendanceQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getCompanyAttendance", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Ручная правка записи (ADMIN), isManual = true' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, PatchAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "patchAttendance", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
function extractIp(req) {
    const forwarded = req.headers?.['x-forwarded-for'];
    return forwarded?.split(',')[0]?.trim() ?? req.ip ?? '0.0.0.0';
}
//# sourceMappingURL=attendance.controller.js.map