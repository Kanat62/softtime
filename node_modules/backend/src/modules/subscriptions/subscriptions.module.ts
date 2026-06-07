import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsController, PaymentsController } from './subscriptions.controller';
import { WebhooksController } from './webhooks.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsCronService } from './subscriptions.cron.service';
import { MockPaymentProvider } from './mock-payment.provider';
import { PAYMENT_PROVIDER } from '../../common/interfaces/payment-provider.interface';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, ConfigModule],
  controllers: [SubscriptionsController, PaymentsController, WebhooksController],
  providers: [
    SubscriptionsService,
    SubscriptionsCronService,
    { provide: PAYMENT_PROVIDER, useClass: MockPaymentProvider },
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
