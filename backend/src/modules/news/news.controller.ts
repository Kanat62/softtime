import {
  Controller,
  Get,
  Post,
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
import { NewsService } from './news.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

const feedQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createNewsSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
});

class FeedQueryDto extends createZodDto(feedQuerySchema) {}
class CreateNewsDto extends createZodDto(createNewsSchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('News')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // ── GET / — feed ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Лента новостей компании (пагинация, desc)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFeed(@Query() query: FeedQueryDto) {
    return this.newsService.getFeed(query);
  }

  // ── POST / — create (ADMIN) ────────────────────────────────────────────────

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Создать новость + push всем ACTIVE сотрудникам (ADMIN)' })
  createNews(@Body() dto: CreateNewsDto, @CurrentUser() user: TenantPayload) {
    return this.newsService.createNews(dto as any, user.userId);
  }

  // ── GET /:id/reads — read stats (ADMIN) ────────────────────────────────────
  // Registered before /:id so NestJS does not swallow "/reads" as an id value

  @Get(':id/reads')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Статистика прочтений: кто прочитал / нет (ADMIN)' })
  getReadStats(@Param('id') id: string) {
    return this.newsService.getReadStats(id);
  }

  // ── GET /:id — detail + auto-mark read ────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Детали новости + авто-отметка прочтения' })
  getNews(@Param('id') id: string, @CurrentUser() user: TenantPayload) {
    return this.newsService.getNews(id, user.userId);
  }

  // ── POST /:id/read — explicit mark read ────────────────────────────────────

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Явная отметка прочтения новости' })
  markRead(@Param('id') id: string, @CurrentUser() user: TenantPayload) {
    return this.newsService.markRead(id, user.userId);
  }
}
