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
exports.SchedulesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_responses_decorator_1 = require("../../common/decorators/api-responses.decorator");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const shared_1 = require("@softtime/shared");
const schedules_service_1 = require("./schedules.service");
const decorators_1 = require("../../common/decorators");
const saveScheduleBodySchema = zod_1.z.object({
    days: shared_1.scheduleSchema,
});
const applyAllBodySchema = zod_1.z.object({
    days: shared_1.scheduleSchema,
    userIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
class SaveScheduleBodyDto extends (0, nestjs_zod_1.createZodDto)(saveScheduleBodySchema) {
}
class ApplyAllBodyDto extends (0, nestjs_zod_1.createZodDto)(applyAllBodySchema) {
}
let SchedulesController = class SchedulesController {
    constructor(schedulesService) {
        this.schedulesService = schedulesService;
    }
    getMySchedule(user) {
        return this.schedulesService.getMySchedule(user.userId);
    }
    getUserSchedule(userId) {
        return this.schedulesService.getUserSchedule(userId);
    }
    saveSchedule(userId, body, user) {
        return this.schedulesService.saveSchedule(userId, body.days, user.userId);
    }
    applyAll(body, user) {
        return this.schedulesService.applyAll(body.days, user.userId, body.userIds);
    }
};
exports.SchedulesController = SchedulesController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Своё расписание на неделю (WORKER + ADMIN)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "getMySchedule", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Расписание конкретного сотрудника (ADMIN)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "getUserSchedule", null);
__decorate([
    (0, common_1.Put)(':userId'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Сохранить/обновить 7 дней расписания (ADMIN), ≥ minWorkdayHours иначе 422' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SaveScheduleBodyDto, Object]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "saveSchedule", null);
__decorate([
    (0, common_1.Post)('apply-all'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Применить шаблон расписания ко всем (или списку) сотрудникам (ADMIN)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ApplyAllBodyDto, Object]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "applyAll", null);
exports.SchedulesController = SchedulesController = __decorate([
    (0, swagger_1.ApiTags)('Schedules'),
    (0, api_responses_decorator_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('schedules'),
    __metadata("design:paramtypes", [schedules_service_1.SchedulesService])
], SchedulesController);
//# sourceMappingURL=schedules.controller.js.map