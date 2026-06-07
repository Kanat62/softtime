import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogsController } from './audit-logs.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
