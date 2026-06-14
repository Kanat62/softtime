import { Module } from '@nestjs/common';
import { UsersController, ProfileController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, SchedulesModule],
  controllers: [UsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
