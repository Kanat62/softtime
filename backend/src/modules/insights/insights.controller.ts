import { Controller, Get, Post, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

@ApiTags('Insights')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('insights')
@Roles('ADMIN')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  // ── GET /insights — fetch latest insight ─────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Получить последний AI-инсайт по посещаемости (ADMIN)' })
  async getInsight(@CurrentUser() user: TenantPayload) {
    const insight = await this.insightsService.getInsight(user.companyId!);
    if (!insight) throw new NotFoundException('Инсайт ещё не сформирован. Попробуйте /insights/regenerate.');
    return insight;
  }

  // ── POST /insights/regenerate — manual trigger ────────────────────────────────

  @Post('regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Принудительно пересчитать AI-инсайт (ADMIN)' })
  async regenerate(@CurrentUser() user: TenantPayload) {
    return this.insightsService.regenerate(user.companyId!);
  }
}
