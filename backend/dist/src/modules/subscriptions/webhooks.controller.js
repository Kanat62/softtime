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
exports.WebhooksController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const subscriptions_service_1 = require("./subscriptions.service");
const decorators_1 = require("../../common/decorators");
const webhookPayloadSchema = zod_1.z.object({
    companyId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['success', 'failed']),
    providerRef: zod_1.z.string().optional(),
    amount: zod_1.z.coerce.number().positive().optional(),
});
class WebhookPayloadDto extends (0, nestjs_zod_1.createZodDto)(webhookPayloadSchema) {
}
let WebhooksController = class WebhooksController {
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    handlePaymentWebhook(dto, signature) {
        return this.subscriptionsService.handleWebhook(dto, signature ?? '');
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('payments'),
    (0, decorators_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Webhook от платёжного провайдера (@Public, проверка подписи)',
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-webhook-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [WebhookPayloadDto, String]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "handlePaymentWebhook", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map