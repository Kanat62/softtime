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
exports.AuditLogsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const audit_service_1 = require("./audit.service");
const decorators_1 = require("../../common/decorators");
const auditLogsQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    action: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
});
class AuditLogsQueryDto extends (0, nestjs_zod_1.createZodDto)(auditLogsQuerySchema) {
}
let AuditLogsController = class AuditLogsController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    list(query) {
        return this.auditService.list(query);
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Аудит-лог действий компании (ADMIN), фильтры + пагинация' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, type: String, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, type: String, example: '2024-01-31' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, type: String, example: 'QR_REGENERATED' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AuditLogsQueryDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "list", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, swagger_1.ApiTags)('Audit Logs'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('audit-logs'),
    (0, decorators_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map