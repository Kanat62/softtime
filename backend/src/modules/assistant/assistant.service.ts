import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { RedisService } from '../../common/redis/redis.service';
import { InsightsAnalyticsService } from '../insights/insights-analytics.service';
import { InsightsLlmService } from '../insights/insights-llm.service';
import type { CompanyAggregates } from '../insights/types';
import {
  ASSISTANT_PERIOD_DAYS,
  ASSISTANT_SUGGESTIONS,
  INSUFFICIENT_DATA_ANSWER,
} from './assistant.constants';

export interface AssistantAnswer {
  answer: string;
  usedPeriodDays: number;
  generatedAt: string;
}

const CACHE_TTL = 60 * 60; // 1 час
const CACHE_KEY = (companyId: string, question: string) =>
  `assistant:v1:${companyId}:${createHash('sha1').update(question).digest('hex')}`;

const SYSTEM_PROMPT = `Ты — ИИ-аналитик посещаемости SoftTime для руководителя малого/среднего бизнеса.
Тебе дают: (1) вопрос руководителя, (2) анонимизированные агрегаты посещаемости его компании за период.
Ответь кратко (2–4 предложения), деловым русским языком, опираясь ТОЛЬКО на цифры из агрегатов.

Правила:
- Используй конкретные числа из данных (проценты, дни недели, тренды).
- Если в данных нет ответа на вопрос — честно скажи, что таких данных нет, не выдумывай.
- Причины формулируй как гипотезы («возможно», «вероятно»), а не как факт и не как обвинение сотрудников.
- Без markdown, без заголовков, без списков — только связный текст.
- Отвечай только на русском.`;

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly analytics: InsightsAnalyticsService,
    private readonly llm: InsightsLlmService,
  ) {}

  getSuggestions(): string[] {
    return ASSISTANT_SUGGESTIONS;
  }

  async ask(companyId: string, question: string): Promise<AssistantAnswer> {
    const generatedAt = new Date().toISOString();

    // 1. Собираем агрегаты по компании (tenant — только companyId из токена)
    const result = await this.analytics.compute(companyId, ASSISTANT_PERIOD_DAYS);

    // 2. Недостаточно данных — дружелюбный ответ, без обращения к LLM
    if (!result.enough) {
      return { answer: INSUFFICIENT_DATA_ANSWER, usedPeriodDays: ASSISTANT_PERIOD_DAYS, generatedAt };
    }

    // 3. Кэш (экономия токенов): ключ по companyId + хэшу вопроса
    const cacheKey = CACHE_KEY(companyId, question);
    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      return { answer: cached, usedPeriodDays: ASSISTANT_PERIOD_DAYS, generatedAt };
    }

    // 4. Генерация ответа (LLM либо stub-fallback)
    const answer = await this.generate(question, result.aggregates);

    await this.redis.set(cacheKey, answer, CACHE_TTL).catch(() => undefined);

    return { answer, usedPeriodDays: ASSISTANT_PERIOD_DAYS, generatedAt };
  }

  // ── LLM вызов (паттерн insights-llm.service.ts: fetch, timeout, fallback) ──────
  private async generate(question: string, aggregates: CompanyAggregates): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — returning stub answer');
      return this.stub(question, aggregates);
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    // Privacy: в LLM уходят ТОЛЬКО обезличенные агрегаты (тот же санитайз, что у инсайтов)
    const sanitized = this.llm.sanitizeAggregates(aggregates);
    const userPrompt =
      `Вопрос руководителя: "${question}"\n\n` +
      `Агрегаты компании за ${aggregates.periodDays} дней:\n${JSON.stringify(sanitized, null, 2)}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 300,
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${text}`);
      }

      const json = (await response.json()) as any;
      const content: string = json.choices?.[0]?.message?.content ?? '';
      if (!content.trim()) throw new Error('Empty response from OpenAI');
      return content.trim();
    } catch (err) {
      this.logger.error('Assistant LLM call failed — using stub', err);
      return this.stub(question, aggregates);
    }
  }

  // Fallback из чисел: осмысленный ответ без интернета (страховка демо §4)
  private stub(_question: string, agg: CompanyAggregates): string {
    const trendWord = (t: string) =>
      t === 'IMPROVING' ? 'улучшается' : t === 'DECLINING' ? 'ухудшается' : 'стабилен';

    const worst = agg.worstWeekday ? `Самый проблемный день недели — ${agg.worstWeekday}. ` : '';
    return (
      `За последние ${agg.periodDays} дней посещаемость составила ${agg.attendanceRate}%, ` +
      `пунктуальность — ${agg.punctualityRate}% (в среднем ${agg.avgLateMinutes} мин опозданий). ` +
      worst +
      `Тренд посещаемости ${trendWord(agg.attendanceTrend)}, пунктуальности — ${trendWord(agg.punctualityTrend)}.`
    );
  }
}
