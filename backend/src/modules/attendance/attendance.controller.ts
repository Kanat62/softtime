import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DayStatus } from '@softtime/shared';
import { AttendanceService } from './attendance.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { CompanyActiveGuard } from '../../common/guards/company-active.guard';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

const checkInOutSchema = z.object({
  qrToken: z.string().min(1, 'qrToken обязателен'),
});

const attendanceMeQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(500).default(30),
});

const attendanceQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  userId: z.string().uuid().optional(),
  status: z.nativeEnum(DayStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

const patchAttendanceSchema = z
  .object({
    checkInAt: z.string().datetime().nullable().optional(),
    checkOutAt: z.string().datetime().nullable().optional(),
    status: z.nativeEnum(DayStatus).optional(),
    note: z.string().max(500).optional(),
  })
  .refine((d) => Object.keys(d).some((k) => d[k as keyof typeof d] !== undefined), {
    message: 'Нет данных для обновления',
  });

const manualAttendanceSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  status: z.nativeEnum(DayStatus),
  checkInAt: z.string().datetime().nullable().optional(),
  checkOutAt: z.string().datetime().nullable().optional(),
  note: z.string().max(500).optional(),
});

class CheckInOutDto extends createZodDto(checkInOutSchema) {}
class AttendanceMeQueryDto extends createZodDto(attendanceMeQuerySchema) {}
class AttendanceQueryDto extends createZodDto(attendanceQuerySchema) {}
class PatchAttendanceDto extends createZodDto(patchAttendanceSchema) {}
class ManualAttendanceDto extends createZodDto(manualAttendanceSchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Attendance')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ── POST /check-in ─────────────────────────────────────────────────────────

  @Post('check-in')
  @UseGuards(CompanyActiveGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отметить приход (QR + IP проверка)' })
  checkIn(
    @Body() body: CheckInOutDto,
    @CurrentUser() user: TenantPayload,
    @Req() req: any,
  ) {
    const ip = extractIp(req);
    return this.attendanceService.checkIn(user.userId, body.qrToken, ip);
  }

  // ── POST /check-out ────────────────────────────────────────────────────────

  @Post('check-out')
  @UseGuards(CompanyActiveGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отметить уход (QR + IP проверка)' })
  checkOut(
    @Body() body: CheckInOutDto,
    @CurrentUser() user: TenantPayload,
    @Req() req: any,
  ) {
    const ip = extractIp(req);
    return this.attendanceService.checkOut(user.userId, body.qrToken, ip);
  }

  // ── DELETE /today/me ───────────────────────────────────────────────────────

  @Delete('today/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить запись посещаемости за сегодня (для тестирования)' })
  clearToday(@CurrentUser() user: TenantPayload) {
    return this.attendanceService.clearToday(user.userId);
  }

  // ── GET /me ────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Своя история посещаемости (WORKER + ADMIN)' })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyHistory(
    @Query() query: AttendanceMeQueryDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.attendanceService.getMyHistory(user.userId, query);
  }

  // ── POST /manual (before /:id to avoid route collision) ───────────────────

  @Post('manual')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Создать запись вручную (ADMIN), isManual = true' })
  createManual(
    @Body() body: ManualAttendanceDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.attendanceService.createManual(body, user.userId);
  }

  // ── GET /today/summary ────────────────────────────────────────────────────

  @Get('today/summary')
  @ApiOperation({ summary: 'Сводка за сегодня: inOffice / left / total (WORKER + ADMIN)' })
  getTodaySummary() {
    return this.attendanceService.getTodaySummary();
  }

  // ── GET /today ─────────────────────────────────────────────────────────────

  @Get('today')
  @ApiOperation({ summary: 'Кто сейчас в офисе (checkIn без checkOut) — WORKER + ADMIN' })
  getTodayInOffice() {
    return this.attendanceService.getTodayInOffice();
  }

  // ── GET / ──────────────────────────────────────────────────────────────────

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Посещаемость компании (ADMIN, фильтры + пагинация)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DayStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCompanyAttendance(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.getCompanyAttendance(query);
  }

  // ── PATCH /:id ─────────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ручная правка записи (ADMIN), isManual = true' })
  patchAttendance(
    @Param('id') id: string,
    @Body() body: PatchAttendanceDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.attendanceService.patchAttendance(id, body, user.userId);
  }

  // ── DELETE /:id ────────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить запись посещаемости (ADMIN)' })
  deleteAttendance(@Param('id') id: string) {
    return this.attendanceService.deleteAttendance(id);
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function extractIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'] as string | undefined;
  return forwarded?.split(',')[0]?.trim() ?? req.ip ?? '0.0.0.0';
}
