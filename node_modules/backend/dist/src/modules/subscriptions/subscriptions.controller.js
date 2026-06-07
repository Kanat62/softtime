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
exports.PaymentsController = exports.SubscriptionsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const subscriptions_service_1 = require("./subscriptions.service");
const decorators_1 = require("../../common/decorators");
const paymentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
class PaymentsQueryDto extends (0, nestjs_zod_1.createZodDto)(paymentsQuerySchema) {
}
let SubscriptionsController = class SubscriptionsController {
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    getMySubscription(user) {
        return this.subscriptionsService.getMySubscription(user.companyId);
    }
    initiatePayment(user) {
        return this.subscriptionsService.initiatePayment(user.companyId);
    }
    cancel(user) {
        return this.subscriptionsService.cancelSubscription(user.companyId, user.userId);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Текущая подписка компании + дней осталось (ADMIN)' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.Post)('pay'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Инициировать оплату $30 → вернуть ссылку (ADMIN)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Post)('cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Отменить подписку → Company SUSPENDED (ADMIN) + audit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "cancel", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('Subscriptions'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('subscriptions'),
    (0, decorators_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
let PaymentsController = class PaymentsController {
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    getPayments(query, user) {
        return this.subscriptionsService.getPayments(user.companyId, query);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'История платежей компании, пагинация (ADMIN)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaymentsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getPayments", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('payments'),
    (0, decorators_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], PaymentsController);
//# sourceMappingURL=subscriptions.controller.js.map