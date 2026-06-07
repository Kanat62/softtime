import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { QrService } from './qr.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTO ──────────────────────────────────────────────────────────────────────

const regenerateSchema = z.object({
  officeNetworkId: z.string().uuid().nullable().optional(),
});

class RegenerateDto extends createZodDto(regenerateSchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('QR')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('qr')
@Roles('ADMIN')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  // ── GET / — активный QR ───────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Получить активный QR токен компании (ADMIN)' })
  getActive() {
    return this.qrService.getActive();
  }

  // ── POST /regenerate — регенерация ────────────────────────────────────────

  @Post('regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Регенерировать QR: деактивировать старый, создать новый (ADMIN) + audit' })
  regenerate(@Body() dto: RegenerateDto, @CurrentUser() user: TenantPayload) {
    return this.qrService.regenerate(dto as any, user.userId);
  }
}
