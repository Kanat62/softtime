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
exports.ReportsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const reports_service_1 = require("./reports.service");
const decorators_1 = require("../../common/decorators");
const reportQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date(),
    to: zod_1.z.coerce.date(),
    userId: zod_1.z.string().uuid().optional(),
});
class ReportQueryDto extends (0, nestjs_zod_1.createZodDto)(reportQuerySchema) {
}
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async exportCsv(query, _user, res) {
        const csv = await this.reportsService.buildCsv(query);
        const from = query.from.toISOString().slice(0, 10);
        const to = query.to.toISOString().slice(0, 10);
        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', `attachment; filename="attendance-${from}_${to}.csv"`);
        return res.send(csv);
    }
    getAttendanceReport(query) {
        return this.reportsService.buildReport(query);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('attendance/export'),
    (0, swagger_1.ApiOperation)({ summary: 'Экспорт отчёта посещаемости в CSV (ADMIN)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: true, type: String, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: true, type: String, example: '2024-01-31' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReportQueryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('attendance'),
    (0, swagger_1.ApiOperation)({ summary: 'Отчёт посещаемости по сотрудникам (ADMIN)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: true, type: String, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: true, type: String, example: '2024-01-31' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReportQueryDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAttendanceReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('reports'),
    (0, decorators_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map