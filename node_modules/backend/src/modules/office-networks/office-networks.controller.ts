import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OfficeNetworksService } from './office-networks.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── CIDR validation ─────────────────────────────────────────────────────────

const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

const createNetworkSchema = z.object({
  label: z.string().min(1).max(100),
  cidr: z.string().regex(cidrPattern, 'Некорректный CIDR или IP (пример: 192.168.1.0/24)'),
});

const updateNetworkSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  cidr: z.string().regex(cidrPattern, 'Некорректный CIDR или IP (пример: 192.168.1.0/24)').optional(),
}).refine((d) => d.label !== undefined || d.cidr !== undefined, {
  message: 'Укажите хотя бы одно поле для обновления',
});

class CreateNetworkDto extends createZodDto(createNetworkSchema) {}
class UpdateNetworkDto extends createZodDto(updateNetworkSchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Office Networks')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('office-networks')
@Roles('ADMIN')
export class OfficeNetworksController {
  constructor(private readonly officeNetworksService: OfficeNetworksService) {}

  // ── GET / ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Список офисных сетей компании (ADMIN)' })
  list() {
    return this.officeNetworksService.list();
  }

  // ── POST / ────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Добавить офисную сеть (ADMIN) + audit' })
  create(@Body() dto: CreateNetworkDto, @CurrentUser() user: TenantPayload) {
    return this.officeNetworksService.create(dto as any, user.userId);
  }

  // ── PATCH /:id ────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить label или cidr сети (ADMIN) + audit' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNetworkDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.officeNetworksService.update(id, dto as any, user.userId);
  }

  // ── DELETE /:id ───────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Удалить офисную сеть (физическое удаление, ADMIN) + audit' })
  remove(@Param('id') id: string, @CurrentUser() user: TenantPayload) {
    return this.officeNetworksService.remove(id, user.userId);
  }
}
