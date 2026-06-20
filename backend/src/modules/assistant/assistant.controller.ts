import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { assistantAskSchema } from '@softtime/shared';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';
import { AssistantService } from './assistant.service';

class AskDto extends createZodDto(assistantAskSchema) {}

@ApiTags('Assistant')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('assistant')
@Roles('ADMIN')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  // ── POST /assistant/ask — вопрос ИИ-аналитику ────────────────────────────────
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Задать вопрос ИИ-аналитику посещаемости (ADMIN)' })
  async ask(@CurrentUser() user: TenantPayload, @Body() dto: AskDto) {
    // companyId берётся ТОЛЬКО из токена (tenant-изоляция), никогда из body
    return this.assistant.ask(user.companyId!, dto.question);
  }

  // ── GET /assistant/suggestions — готовые быстрые вопросы ──────────────────────
  @Get('suggestions')
  @ApiOperation({ summary: 'Получить готовые быстрые вопросы (ADMIN)' })
  getSuggestions() {
    return { suggestions: this.assistant.getSuggestions() };
  }
}
