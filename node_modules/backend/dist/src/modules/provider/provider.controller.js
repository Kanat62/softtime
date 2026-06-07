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
exports.ProviderController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const shared_1 = require("@softtime/shared");
const provider_service_1 = require("./provider.service");
const decorators_1 = require("../../common/decorators");
const companiesQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(shared_1.CompanyStatus).optional(),
    subscriptionStatus: zod_1.z.nativeEnum(shared_1.SubStatus).optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
const paymentsQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    companyId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(shared_1.PaymentStatus).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
class CompaniesQueryDto extends (0, nestjs_zod_1.createZodDto)(companiesQuerySchema) {
}
class PaymentsQueryDto extends (0, nestjs_zod_1.createZodDto)(paymentsQuerySchema) {
}
let ProviderController = class ProviderController {
    constructor(providerService) {
        this.providerService = providerService;
    }
    getDashboard() {
        return this.providerService.getDashboard();
    }
    listPayments(query) {
        return this.providerService.listPayments(query);
    }
    listCompanies(query) {
        return this.providerService.listCompanies(query);
    }
    activate(id, user) {
        return this.providerService.activateCompany(id, user.userId);
    }
    suspend(id, user) {
        return this.providerService.suspendCompany(id, user.userId);
    }
    getCompany(id) {
        return this.providerService.getCompany(id);
    }
};
exports.ProviderController = ProviderController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Метрики платформы: MRR, выручка, компании, регистрации (PROVIDER)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProviderController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Все платежи платформы + сводка (PROVIDER)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: shared_1.PaymentStatus }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaymentsQueryDto]),
    __metadata("design:returntype", void 0)
], ProviderController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Get)('companies'),
    (0, swagger_1.ApiOperation)({ summary: 'Все компании платформы с фильтрами (PROVIDER)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: shared_1.CompanyStatus }),
    (0, swagger_1.ApiQuery)({ name: 'subscriptionStatus', required: false, enum: shared_1.SubStatus }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CompaniesQueryDto]),
    __metadata("design:returntype", void 0)
], ProviderController.prototype, "listCompanies", null);
__decorate([
    (0, common_1.Patch)('companies/:id/activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Активировать компанию + подписку (PROVIDER) + audit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProviderController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)('companies/:id/suspend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Приостановить компанию (PROVIDER) + push ADMIN + audit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProviderController.prototype, "suspend", null);
__decorate([
    (0, common_1.Get)('companies/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Детали компании: сотрудники + история платежей (PROVIDER)' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProviderController.prototype, "getCompany", null);
exports.ProviderController = ProviderController = __decorate([
    (0, swagger_1.ApiTags)('Provider'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('provider'),
    (0, decorators_1.Roles)('PROVIDER'),
    __metadata("design:paramtypes", [provider_service_1.ProviderService])
], ProviderController);
//# sourceMappingURL=provider.controller.js.map