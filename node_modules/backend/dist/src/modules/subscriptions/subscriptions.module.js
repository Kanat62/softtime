"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const subscriptions_controller_1 = require("./subscriptions.controller");
const webhooks_controller_1 = require("./webhooks.controller");
const subscriptions_service_1 = require("./subscriptions.service");
const subscriptions_cron_service_1 = require("./subscriptions.cron.service");
const mock_payment_provider_1 = require("./mock-payment.provider");
const payment_provider_interface_1 = require("../../common/interfaces/payment-provider.interface");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule, notifications_module_1.NotificationsModule, config_1.ConfigModule],
        controllers: [subscriptions_controller_1.SubscriptionsController, subscriptions_controller_1.PaymentsController, webhooks_controller_1.WebhooksController],
        providers: [
            subscriptions_service_1.SubscriptionsService,
            subscriptions_cron_service_1.SubscriptionsCronService,
            { provide: payment_provider_interface_1.PAYMENT_PROVIDER, useClass: mock_payment_provider_1.MockPaymentProvider },
        ],
        exports: [subscriptions_service_1.SubscriptionsService],
    })
], SubscriptionsModule);
//# sourceMappingURL=subscriptions.module.js.map