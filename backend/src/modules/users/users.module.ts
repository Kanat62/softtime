import { Module } from '@nestjs/common';
import {
  UsersController,
  ProfileController,
  UserMeController,
} from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, SchedulesModule],
  // UserMeController раньше UsersController: иначе 'users/me/language'
  // попало бы в 'users/:id/...' этого контроллера с @Roles('ADMIN').
  controllers: [UserMeController, UsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
