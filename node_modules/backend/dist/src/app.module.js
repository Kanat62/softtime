"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const env_validation_1 = require("./config/env.validation");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./common/redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const companies_module_1 = require("./modules/companies/companies.module");
const users_module_1 = require("./modules/users/users.module");
const schedules_module_1 = require("./modules/schedules/schedules.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const requests_module_1 = require("./modules/requests/requests.module");
const news_module_1 = require("./modules/news/news.module");
const office_networks_module_1 = require("./modules/office-networks/office-networks.module");
const qr_module_1 = require("./modules/qr/qr.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const reports_module_1 = require("./modules/reports/reports.module");
const settings_module_1 = require("./modules/settings/settings.module");
const provider_module_1 = require("./modules/provider/provider.module");
const devices_module_1 = require("./modules/devices/devices.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const status_guard_1 = require("./common/guards/status.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: env_validation_1.validateEnv,
                expandVariables: true,
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                    transport: process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
                        : undefined,
                    redact: {
                        paths: [
                            'req.headers.authorization',
                            'req.body.password',
                            'req.body.passwordHash',
                            'req.body.refreshToken',
                            'req.body.fcmToken',
                        ],
                        censor: '[REDACTED]',
                    },
                    serializers: {
                        req(req) {
                            return {
                                method: req.method,
                                url: req.url,
                                id: req.id,
                            };
                        },
                    },
                    autoLogging: true,
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 60,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            users_module_1.UsersModule,
            schedules_module_1.SchedulesModule,
            attendance_module_1.AttendanceModule,
            requests_module_1.RequestsModule,
            news_module_1.NewsModule,
            office_networks_module_1.OfficeNetworksModule,
            qr_module_1.QrModule,
            subscriptions_module_1.SubscriptionsModule,
            reports_module_1.ReportsModule,
            settings_module_1.SettingsModule,
            provider_module_1.ProviderModule,
            devices_module_1.DevicesModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_GUARD, useClass: status_guard_1.StatusGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map