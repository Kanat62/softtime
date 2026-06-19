import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { Sti161OverlayService } from './pdf/sti161-overlay.service';
import { PaymentReceiptService } from './pdf/payment-receipt.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, Sti161OverlayService, PaymentReceiptService],
  exports: [PaymentReceiptService],
})
export class ReportsModule {}
