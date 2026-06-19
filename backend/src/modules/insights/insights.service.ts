import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { InsightsAnalyticsService } from './insights-analytics.service';
import { InsightsLlmService } from './insights-llm.service';
import type { StoredInsight } from './types';

const CACHE_TTL = 25 * 60 * 60; // 25 hours
const CACHE_KEY = (companyId: string) => `insights:v1:${companyId}`;

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly analytics: InsightsAnalyticsService,
    private readonly llm: InsightsLlmService,
  ) {}

  // ─── Read latest insight (cache → DB) ────────────────────────────────────────

  async getInsight(companyId: string): Promise<StoredInsight | null> {
    // 1. Check Redis cache first
    const cached = await this.redis.get(CACHE_KEY(companyId));
    if (cached) {
      try {
        return JSON.parse(cached) as StoredInsight;
      } catch {
        // corrupted cache — fall through to DB
      }
    }

    // 2. Check DB
    const row = await this.prisma.aiInsight.findUnique({
      where: { companyId },
    });
    if (!row) return null;

    const stored: StoredInsight = {
      companyId: (row as any).companyId,
      generatedAt: (row as any).generatedAt,
      insight: (row as any).insight,
      isEnough: (row as any).isEnough,
    };

    // Warm the cache
    await this.redis.set(CACHE_KEY(companyId), JSON.stringify(stored), CACHE_TTL);
    return stored;
  }

  // ─── Generate + persist (used by cron and manual trigger) ────────────────────

  async regenerate(companyId: string): Promise<StoredInsight> {
    this.logger.log(`Generating insight for company ${companyId}`);

    const result = await this.analytics.compute(companyId);

    let insightText: string;
    let isEnough: boolean;
    let aggregates: Record<string, unknown>;

    if (!result.enough) {
      insightText = this.llm.insufficientDataMessage();
      isEnough = false;
      aggregates = { reason: result.reason };
    } else {
      insightText = await this.llm.generate(result.aggregates);
      isEnough = true;
      aggregates = result.aggregates as unknown as Record<string, unknown>;
    }

    // Upsert in DB
    const row = await this.prisma.aiInsight.upsert({
      where: { companyId },
      create: { companyId, insight: insightText, aggregates, isEnough },
      update: {
        insight: insightText,
        aggregates,
        isEnough,
        generatedAt: new Date(),
      },
    });

    const stored: StoredInsight = {
      companyId: row.companyId,
      generatedAt: row.generatedAt,
      insight: row.insight,
      isEnough: row.isEnough,
    };

    // Invalidate + refresh cache
    await this.redis.set(CACHE_KEY(companyId), JSON.stringify(stored), CACHE_TTL);
    return stored;
  }
}
