import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceCronService } from './attendance.cron.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanyActiveGuard } from '../../common/guards/company-active.guard';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceCronService, CompanyActiveGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
