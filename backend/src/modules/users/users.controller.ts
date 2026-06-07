import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiStandardErrors } from '../../common/decorators/api-responses.decorator';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserStatus } from '@softtime/shared';
import { UsersService } from './users.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── Query / body schemas ─────────────────────────────────────────────────────

const listUsersQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const setStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED', 'WARNING']),
});

const setNoteSchema = z.object({
  note: z.string().max(1000),
});

const updateProfileSchema = z
  .object({
    avatarUrl: z.string().url().nullable().optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8).max(72).optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: 'currentPassword обязателен при смене пароля',
    path: ['currentPassword'],
  });

class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
class SetStatusDto extends createZodDto(setStatusSchema) {}
class SetNoteDto extends createZodDto(setNoteSchema) {}
class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

// ─── /users ───────────────────────────────────────────────────────────────────

@ApiTags('Users')
@ApiStandardErrors()
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Список сотрудников с фильтрами и пагинацией' })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Профиль сотрудника + история посещаемости + заявки' })
  getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'PENDING → ACTIVE + push WORKER' })
  approveUser(
    @Param('id') id: string,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.usersService.approveUser(id, user.userId);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отклонить регистрацию PENDING + push WORKER' })
  async rejectUser(
    @Param('id') id: string,
    @CurrentUser() user: TenantPayload,
  ) {
    await this.usersService.rejectUser(id, user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Сменить статус (ACTIVE / BLOCKED / WARNING)' })
  setUserStatus(
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.usersService.setUserStatus(id, dto.status as UserStatus, user.userId);
  }

  @Patch(':id/note')
  @ApiOperation({ summary: 'Сохранить admin-комментарий' })
  setAdminNote(
    @Param('id') id: string,
    @Body() dto: SetNoteDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.usersService.setAdminNote(id, dto.note, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete пользователя (deletedAt)' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: TenantPayload,
  ) {
    await this.usersService.deleteUser(id, user.userId);
  }
}

// ─── /profile ─────────────────────────────────────────────────────────────────

@ApiTags('Profile')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Свой профиль (WORKER + ADMIN)' })
  getMyProfile(@CurrentUser() user: TenantPayload) {
    return this.usersService.getMyProfile(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Обновить аватар / сменить пароль (bcrypt 12)' })
  updateMyProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.usersService.updateMyProfile(user.userId, dto);
  }
}
