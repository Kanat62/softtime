import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RequestStatus, RequestType } from '@softtime/shared';
import { absenceRequestSchema } from '@softtime/shared';
import { RequestsService } from './requests.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class CreateRequestDto extends createZodDto(absenceRequestSchema) {}

const myRequestsQuerySchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const companyRequestsQuerySchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const rejectBodySchema = z.object({
  decisionNote: z.string().max(500).optional(),
});

class MyRequestsQueryDto extends createZodDto(myRequestsQuerySchema) {}
class CompanyRequestsQueryDto extends createZodDto(companyRequestsQuerySchema) {}
class RejectBodyDto extends createZodDto(rejectBodySchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Requests')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // ── POST / ─────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Подать заявку (WORKER + ADMIN). Push → ADMIN.' })
  createRequest(
    @Body() dto: CreateRequestDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.requestsService.createRequest(
      dto as any,
      user.userId,
      user.companyId!,
    );
  }

  // ── GET /me ────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Свои заявки (WORKER + ADMIN)' })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyRequests(
    @Query() query: MyRequestsQueryDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.requestsService.getMyRequests(user.userId, query);
  }

  // ── GET / ──────────────────────────────────────────────────────────────────

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Входящие заявки компании (ADMIN, фильтры + пагинация)' })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCompanyRequests(@Query() query: CompanyRequestsQueryDto) {
    return this.requestsService.getCompanyRequests(query);
  }

  // ── PATCH /:id/approve ─────────────────────────────────────────────────────

  @Patch(':id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Одобрить заявку. APPROVED_ABSENCE на дни / EARLY_LEAVE mark.' })
  approveRequest(
    @Param('id') id: string,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.requestsService.approveRequest(id, user.userId);
  }

  // ── PATCH /:id/reject ──────────────────────────────────────────────────────

  @Patch(':id/reject')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отклонить заявку с необязательным комментарием.' })
  rejectRequest(
    @Param('id') id: string,
    @Body() body: RejectBodyDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.requestsService.rejectRequest(id, user.userId, body.decisionNote);
  }
}
