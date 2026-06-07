import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SettingsService } from './settings.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTO ──────────────────────────────────────────────────────────────────────

const updateSettingsSchema = z
  .object({
    minWorkdayHours: z.number().int().min(1).max(24).optional(),
    defaultCheckoutBuffer: z.number().int().min(0).max(480).optional(),
  })
  .refine((d) => d.minWorkdayHours !== undefined || d.defaultCheckoutBuffer !== undefined, {
    message: 'Укажите хотя бы одно поле',
  });

class UpdateSettingsDto extends createZodDto(updateSettingsSchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Settings')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('settings')
@Roles('ADMIN')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Настройки компании: minWorkdayHours, defaultCheckoutBuffer (ADMIN)' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Обновить настройки компании (ADMIN) + audit' })
  updateSettings(@Body() dto: UpdateSettingsDto, @CurrentUser() user: TenantPayload) {
    return this.settingsService.updateSettings(dto as any, user.userId);
  }
}
