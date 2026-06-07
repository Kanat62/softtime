import { Controller, Get, Put, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiStandardErrors } from '../../common/decorators/api-responses.decorator';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { scheduleSchema } from '@softtime/shared';
import { SchedulesService } from './schedules.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

const saveScheduleBodySchema = z.object({
  days: scheduleSchema,
});

const applyAllBodySchema = z.object({
  days: scheduleSchema,
  /** Применить только к этим userId; если не передано — ко всем сотрудникам */
  userIds: z.array(z.string().uuid()).optional(),
});

class SaveScheduleBodyDto extends createZodDto(saveScheduleBodySchema) {}
class ApplyAllBodyDto extends createZodDto(applyAllBodySchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Schedules')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Своё расписание на неделю (WORKER + ADMIN)' })
  getMySchedule(@CurrentUser() user: TenantPayload) {
    return this.schedulesService.getMySchedule(user.userId);
  }

  @Get(':userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Расписание конкретного сотрудника (ADMIN)' })
  getUserSchedule(@Param('userId') userId: string) {
    return this.schedulesService.getUserSchedule(userId);
  }

  @Put(':userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Сохранить/обновить 7 дней расписания (ADMIN), ≥ minWorkdayHours иначе 422' })
  saveSchedule(
    @Param('userId') userId: string,
    @Body() body: SaveScheduleBodyDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.schedulesService.saveSchedule(userId, body.days, user.userId);
  }

  @Post('apply-all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Применить шаблон расписания ко всем (или списку) сотрудникам (ADMIN)' })
  applyAll(
    @Body() body: ApplyAllBodyDto,
    @CurrentUser() user: TenantPayload,
  ) {
    return this.schedulesService.applyAll(body.days, user.userId, body.userIds);
  }
}
