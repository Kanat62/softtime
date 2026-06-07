import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiStandardErrors } from '../../common/decorators/api-responses.decorator';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DevicesService } from './devices.service';
import { CurrentUser } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTO ──────────────────────────────────────────────────────────────────────

const registerDeviceSchema = z.object({
  fcmToken: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

class RegisterDeviceDto extends createZodDto(registerDeviceSchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Devices')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  // ── POST /devices ─────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Зарегистрировать FCM токен устройства (WORKER + ADMIN + PROVIDER)' })
  register(@Body() dto: RegisterDeviceDto, @CurrentUser() user: TenantPayload) {
    return this.devicesService.register(user.userId, dto.fcmToken, dto.platform);
  }

  // ── DELETE /devices/:token ────────────────────────────────────────────────

  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Удалить FCM токен при logout (WORKER + ADMIN + PROVIDER)' })
  remove(@Param('token') token: string, @CurrentUser() user: TenantPayload) {
    return this.devicesService.remove(user.userId, token);
  }
}
