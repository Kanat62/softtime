// Generates AI insight directly (bypasses HTTP auth).
// Run inside Docker: docker compose exec api node /app/prisma/trigger-insight.js
'use strict';

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { randomUUID } = require('crypto');

const DB_URL  = process.env.DATABASE_URL  || 'postgresql://softtime:softtime@localhost:5433/softtime';
const API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL   = process.env.OPENAI_MODEL   || 'gpt-4o-mini';

const PRESENT_STATUSES = ['PRESENT', 'LATE', 'EARLY_LEAVE', 'OVERTIME', 'MANUAL', 'INCOMPLETE'];

function pct(n, d) { return d === 0 ? 0 : Math.round(n / d * 100 * 10) / 10; }

function utcMidnight(d) {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

async function buildAggregates(prisma, companyId) {
  const to = utcMidnight(new Date());
  const from = new Date(to.getTime() - 30 * 86400000);

  const empCount = await prisma.user.count({
    where: { companyId, role: 'WORKER', status: { in: ['ACTIVE', 'WARNING'] }, deletedAt: null },
  });

  const records = await prisma.attendance.findMany({
    where: { companyId, date: { gte: from, lt: to } },
    select: { date: true, status: true, checkInAt: true, userId: true },
  });

  if (empCount < 3 || records.length < 7) {
    return { enough: false, reason: `Сотрудников ${empCount} (минимум 3), записей ${records.length} (минимум 7).` };
  }

  let presentCount = 0, absentCount = 0, lateCount = 0;
  const dayBuckets = {};
  const weekBuckets = {};
  const WNAMES = { 0:'ВС',1:'ПН',2:'ВТ',3:'СР',4:'ЧТ',5:'ПТ',6:'СБ' };

  for (const rec of records) {
    const d   = new Date(rec.date);
    const dow = d.getUTCDay();
    const ws  = (() => { const x = new Date(d); x.setUTCDate(x.getUTCDate() - ((dow+6)%7)); return x.toISOString().slice(0,10); })();

    if (!dayBuckets[dow])  dayBuckets[dow]  = { present:0, total:0, late:0 };
    if (!weekBuckets[ws])  weekBuckets[ws]  = { present:0, total:0, late:0 };

    const isPresent = PRESENT_STATUSES.includes(rec.status);
    const isAbsent  = rec.status === 'ABSENT';
    const isLate    = rec.status === 'LATE';

    dayBuckets[dow].total++;
    weekBuckets[ws].total++;

    if (isPresent) { presentCount++; dayBuckets[dow].present++; weekBuckets[ws].present++; }
    if (isAbsent)  { absentCount++; }
    if (isLate)    { lateCount++;   dayBuckets[dow].late++;    weekBuckets[ws].late++; }
  }

  const total = presentCount + absentCount;
  const dayBreakdown = [];
  for (let i = 1; i <= 5; i++) {
    const b = dayBuckets[i];
    if (!b || b.total < 2) continue;
    dayBreakdown.push({ weekday: WNAMES[i], attendanceRate: pct(b.present, b.total), punctualityRate: pct(b.present - b.late, b.present), sampleSize: b.total });
  }

  const sortedWeeks = Object.entries(weekBuckets).sort((a,b) => a[0].localeCompare(b[0])).slice(-4);
  const weeklyTrend = sortedWeeks.map(([k,b]) => ({ weekLabel:k, attendanceRate: pct(b.present,b.total), punctualityRate: pct(b.present-b.late,b.present) }));

  function trend(vals) {
    if (vals.length < 2) return 'STABLE';
    const f = vals.slice(0, Math.ceil(vals.length/2));
    const s = vals.slice(Math.floor(vals.length/2));
    const d = s.reduce((a,b)=>a+b,0)/s.length - f.reduce((a,b)=>a+b,0)/f.length;
    return d > 3 ? 'IMPROVING' : d < -3 ? 'DECLINING' : 'STABLE';
  }

  const worstDay = dayBreakdown.length ? dayBreakdown.reduce((a,b) => a.attendanceRate < b.attendanceRate ? a : b).weekday : null;
  const bestDay  = dayBreakdown.length ? dayBreakdown.reduce((a,b) => a.attendanceRate > b.attendanceRate ? a : b).weekday : null;

  return {
    enough: true,
    aggregates: {
      period: `${from.toISOString().slice(0,10)} — ${to.toISOString().slice(0,10)} (30 дней)`,
      periodDays: 30, employeeCount: empCount,
      totalScheduledRecords: total, presentCount, absentCount, lateCount,
      attendanceRate: pct(presentCount, total), punctualityRate: pct(presentCount-lateCount, presentCount),
      worstWeekday: worstDay, bestWeekday: bestDay,
      dayBreakdown, weeklyTrend,
      attendanceTrend: trend(weeklyTrend.map(w => w.attendanceRate)),
      punctualityTrend: trend(weeklyTrend.map(w => w.punctualityRate)),
    },
  };
}

async function callOpenAI(aggregates) {
  if (!API_KEY) {
    console.log('  No OPENAI_API_KEY — using stub text.');
    return `Посещаемость за период: ${aggregates.attendanceRate}%. Пунктуальность: ${aggregates.punctualityRate}%. (Нет OPENAI_API_KEY — stub режим)`;
  }

  const system = `Ты — аналитик посещаемости для малого и среднего бизнеса.
Ты получаешь анонимизированные агрегированные показатели посещаемости.
Напиши деловой инсайт (3–5 абзацев) на русском языке для владельца.

Структура:
1. Краткая оценка с ключевыми цифрами.
2. Наиболее заметная проблема или закономерность.
3. Гипотеза о причине (обязательно как предположение: «возможно», «вероятно»).
4. Конкретная рекомендация.

Правила: только предоставленные числа, причины — гипотезы, не обвинения. Без markdown. Только русский.`;

  const user = `Показатели посещаемости:\n${JSON.stringify(aggregates, null, 2)}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role:'system', content:system },{ role:'user', content:user }], max_tokens: 500, temperature: 0.4 }),
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}

async function main() {
  const adapter = new PrismaPg({ connectionString: DB_URL });
  const prisma  = new PrismaClient({ adapter });

  try {
    const company = await prisma.company.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });
    if (!company) { console.error('No company found.'); process.exit(1); }
    console.log(`\n  Company: ${company.name}`);

    console.log('  Computing attendance aggregates...');
    const result = await buildAggregates(prisma, company.id);

    let insightText, isEnough, aggregates;

    if (!result.enough) {
      console.log('  Not enough data:', result.reason);
      insightText = 'Недостаточно данных для формирования аналитики. Добавьте сотрудников и накопите данные за 1–2 недели.';
      isEnough = false;
      aggregates = { reason: result.reason };
    } else {
      const agg = result.aggregates;
      console.log(`  Stats: ${agg.employeeCount} employees, attendance=${agg.attendanceRate}%, punctuality=${agg.punctualityRate}%`);
      console.log(`  Trend: attendance=${agg.attendanceTrend}, punctuality=${agg.punctualityTrend}`);
      console.log('  Calling OpenAI...');
      insightText = await callOpenAI(agg);
      isEnough = true;
      aggregates = agg;
    }

    // Upsert AiInsight
    await prisma.aiInsight.upsert({
      where: { companyId: company.id },
      create: { id: randomUUID(), companyId: company.id, insight: insightText, aggregates, isEnough },
      update: { insight: insightText, aggregates, isEnough, generatedAt: new Date() },
    });

    // Invalidate Redis cache
    try {
      const { default: Redis } = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
      await redis.del(`insights:v1:${company.id}`);
      await redis.quit();
      console.log('  Redis cache invalidated.');
    } catch (e) {
      console.log('  Redis flush skipped:', e.message);
    }

    console.log('\n  Insight saved successfully.');
    if (insightText.length > 200) {
      console.log('  Preview:', insightText.slice(0, 200) + '...\n');
    } else {
      console.log('  Text:', insightText, '\n');
    }

  } catch (err) {
    console.error('Failed:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
