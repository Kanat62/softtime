import { Module } from '@nestjs/common';
import { OfficeNetworksController } from './office-networks.controller';
import { OfficeNetworksService } from './office-networks.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OfficeNetworksController],
  providers: [OfficeNetworksService],
  exports: [OfficeNetworksService],
})
export class OfficeNetworksModule {}
