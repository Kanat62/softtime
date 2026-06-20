import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { RequestsModule } from './modules/requests/requests.module';
import { NewsModule } from './modules/news/news.module';
import { OfficeNetworksModule } from './modules/office-networks/office-networks.module';
import { QrModule } from './modules/qr/qr.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProviderModule } from './modules/provider/provider.module';
import { DevicesModule } from './modules/devices/devices.module';
import { InsightsModule } from './modules/insights/insights.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { StatusGuard } from './common/guards/status.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      expandVariables: true,
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
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

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),

    ScheduleModule.forRoot(),

    PrismaModule,
    RedisModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    SchedulesModule,
    AttendanceModule,
    RequestsModule,
    NewsModule,
    OfficeNetworksModule,
    QrModule,
    SubscriptionsModule,
    ReportsModule,
    SettingsModule,
    ProviderModule,
    DevicesModule,
    InsightsModule,
    AssistantModule,
  ],
  providers: [
    // Global guard chain (order = declaration order):
    // 1. JWT validation (skips @Public routes)
    // 2. Role check (@Roles decorator)
    // 3. User status check (blocks BLOCKED / PENDING)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: StatusGuard },
  ],
})
export class AppModule {}
