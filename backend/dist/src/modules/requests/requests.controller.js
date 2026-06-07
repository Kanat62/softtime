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
exports.RequestsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const shared_1 = require("@softtime/shared");
const shared_2 = require("@softtime/shared");
const requests_service_1 = require("./requests.service");
const decorators_1 = require("../../common/decorators");
class CreateRequestDto extends (0, nestjs_zod_1.createZodDto)(shared_2.absenceRequestSchema) {
}
const myRequestsQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(shared_1.RequestStatus).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
const companyRequestsQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(shared_1.RequestStatus).optional(),
    userId: zod_1.z.string().uuid().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
const rejectBodySchema = zod_1.z.object({
    decisionNote: zod_1.z.string().max(500).optional(),
});
class MyRequestsQueryDto extends (0, nestjs_zod_1.createZodDto)(myRequestsQuerySchema) {
}
class CompanyRequestsQueryDto extends (0, nestjs_zod_1.createZodDto)(companyRequestsQuerySchema) {
}
class RejectBodyDto extends (0, nestjs_zod_1.createZodDto)(rejectBodySchema) {
}
let RequestsController = class RequestsController {
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    createRequest(dto, user) {
        return this.requestsService.createRequest(dto, user.userId, user.companyId);
    }
    getMyRequests(query, user) {
        return this.requestsService.getMyRequests(user.userId, query);
    }
    getCompanyRequests(query) {
        return this.requestsService.getCompanyRequests(query);
    }
    approveRequest(id, user) {
        return this.requestsService.approveRequest(id, user.userId);
    }
    rejectRequest(id, body, user) {
        return this.requestsService.rejectRequest(id, user.userId, body.decisionNote);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Подать заявку (WORKER + ADMIN). Push → ADMIN.' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateRequestDto, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Свои заявки (WORKER + ADMIN)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: shared_1.RequestStatus }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MyRequestsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Входящие заявки компании (ADMIN, фильтры + пагинация)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: shared_1.RequestStatus }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CompanyRequestsQueryDto]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getCompanyRequests", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Одобрить заявку. APPROVED_ABSENCE на дни / EARLY_LEAVE mark.' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Отклонить заявку с необязательным комментарием.' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RejectBodyDto, Object]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "rejectRequest", null);
exports.RequestsController = RequestsController = __decorate([
    (0, swagger_1.ApiTags)('Requests'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('requests'),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map