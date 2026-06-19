import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CompanyAggregates } from './types';

const INSUFFICIENT_DATA_MSG =
  'Данных пока недостаточно для формирования аналитики. ' +
  'Добавьте сотрудников и дайте системе накопить данные за 1–2 недели.';

@Injectable()
export class InsightsLlmService {
  private readonly logger = new Logger(InsightsLlmService.name);

  constructor(private readonly config: ConfigService) {}

  async generate(aggregates: CompanyAggregates): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — returning stub insight');
      return this.stub(aggregates);
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    // Privacy: only anonymized aggregates — no names, no IDs
    const dataBlock = JSON.stringify(this.sanitize(aggregates), null, 2);

    const systemPrompt = `Ты — аналитик посещаемости для малого и среднего бизнеса.
Ты получаешь анонимизированные агрегированные показатели посещаемости компании.
Твоя задача — написать короткий деловой инсайт (3–5 абзацев) на русском языке для владельца бизнеса.

Структура ответа:
1. Краткая оценка ситуации (1–2 предложения с ключевыми цифрами).
2. Наиболее заметная проблема или закономерность.
3. Гипотеза о возможной причине — ОБЯЗАТЕЛЬНО формулируй как предположение («возможно», «вероятно», «это может быть связано с»), а НЕ как установленный факт.
4. Конкретная рекомендация действия для руководителя.

Правила:
- Используй ТОЛЬКО предоставленные числа. Не выдумывай данные.
- Причины формулируй как гипотезы о системах и условиях, а НЕ как обвинение сотрудников.
- Пиши кратко, деловым языком. Без markdown и заголовков.
- Если тренд улучшается — отметь это позитивно.
- Ответ только на русском языке.`;

    const userPrompt = `Вот агрегированные показатели посещаемости компании за последние ${aggregates.periodDays} дней:\n\n${dataBlock}`;

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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
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
      this.logger.error('LLM generation failed', err);
      return this.stub(aggregates);
    }
  }

  // Fallback when API key is missing or call fails
  private stub(agg: CompanyAggregates): string {
    return (
      `Посещаемость за период: ${agg.attendanceRate}% (${agg.presentCount} из ${agg.totalScheduledRecords} ` +
      `рабочих дней). Пунктуальность: ${agg.punctualityRate}%. ` +
      `Тренд посещаемости: ${agg.attendanceTrend === 'IMPROVING' ? 'улучшается' : agg.attendanceTrend === 'DECLINING' ? 'ухудшается' : 'стабилен'}. ` +
      `(Подключите OPENAI_API_KEY для детальных рекомендаций.)`
    );
  }

  insufficientDataMessage(): string {
    return INSUFFICIENT_DATA_MSG;
  }

  // Sanitize: ensure no employee-level data is sent to LLM
  private sanitize(agg: CompanyAggregates): Omit<CompanyAggregates, 'periodFrom' | 'periodTo'> & { period: string } {
    return {
      period: `${agg.periodFrom} — ${agg.periodTo} (${agg.periodDays} дней)`,
      periodDays: agg.periodDays,
      employeeCount: agg.employeeCount,
      totalScheduledRecords: agg.totalScheduledRecords,
      presentCount: agg.presentCount,
      absentCount: agg.absentCount,
      lateCount: agg.lateCount,
      attendanceRate: agg.attendanceRate,
      punctualityRate: agg.punctualityRate,
      avgLateMinutes: agg.avgLateMinutes,
      worstWeekday: agg.worstWeekday,
      bestWeekday: agg.bestWeekday,
      dayBreakdown: agg.dayBreakdown,
      weeklyTrend: agg.weeklyTrend,
      attendanceTrend: agg.attendanceTrend,
      punctualityTrend: agg.punctualityTrend,
    };
  }
}
