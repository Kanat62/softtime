// Demo seed — attendance data for the last 14 calendar days.
//
// Run from project ROOT (against Docker DB):
//   DATABASE_URL=postgresql://softtime:softtime@localhost:5433/softtime node backend/prisma/seed.js
//
// Run INSIDE the Docker container:
//   docker compose exec api node /app/prisma/seed.js
//
// Re-running is safe — clears records for the same employees and period first.

'use strict';

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { randomUUID } = require('crypto');

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://softtime:softtime@localhost:5433/softtime';

// ─── LCG pseudo-random (seeded, reproducible) ────────────────────────────────
function makePrng(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function utcMidnight(d) {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function atMinute(day, totalMinutes) {
  const d = utcMidnight(day);
  d.setUTCHours(
    Math.floor(totalMinutes / 60),
    totalMinutes % 60,
    Math.floor(Math.random() * 59),
    0,
  );
  return d;
}

function workingDays(startDate, endDate) {
  const days = [];
  const cur = utcMidnight(startDate);
  const end = utcMidnight(endDate);
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow >= 1 && dow <= 5) days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function weekStartKey(date) {
  const d = utcMidnight(date);
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const adapter = new PrismaPg({ connectionString: DB_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Find company
    const company = await prisma.company.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!company) {
      console.error('No company found. Register via /auth/register-company first.');
      process.exit(1);
    }
    console.log(`\n  Company: ${company.name} (${company.id})\n`);

    // 2. Find active workers
    const employees = await prisma.user.findMany({
      where: {
        companyId: company.id,
        role: 'WORKER',
        status: { in: ['ACTIVE', 'WARNING'] },
        deletedAt: null,
      },
      orderBy: { fullName: 'asc' },
    });

    if (employees.length < 3) {
      console.error(`Need >= 3 active workers, found ${employees.length}.`);
      process.exit(1);
    }

    // 3. Split into 3 groups (by alphabetical order)
    const g1 = Math.ceil(employees.length / 3);
    const g2 = Math.ceil((employees.length * 2) / 3);

    const GROUPS = [
      {
        name: 'Tsekh A',       // Цех А
        label: 'A',
        emps: employees.slice(0, g1),
        shiftStart: 9, shiftEnd: 18,
        lateW1: 8,  lateW2: 8,
        lateRange:  [8, 18],
        earlyRange: [2, 5],
        lateRangeW2:  null,
        lateRangeMon: null,
        absences: 0,
      },
      {
        name: 'Stroyka 3',     // Стройка №3
        label: 'B',
        emps: employees.slice(g1, g2),
        shiftStart: 8, shiftEnd: 17,
        lateW1: 18, lateW2: 18,
        lateRange:  [7, 18],
        earlyRange: [1, 4],
        lateRangeW2:  null,
        lateRangeMon: null,
        absences: 1,
      },
      {
        name: 'Tsekh B',       // Цех Б
        label: 'C',
        emps: employees.slice(g2),
        shiftStart: 8, shiftEnd: 17,
        lateW1: 27, lateW2: 47,
        lateRange:  [15, 30],
        earlyRange: [1, 3],
        lateRangeW2:  [20, 35],
        lateRangeMon: [30, 50],
        absences: 1,
      },
    ];

    console.log('  Department assignments:');
    for (const g of GROUPS) {
      const display = g.label === 'A' ? 'Цех А' : g.label === 'B' ? 'Стройка №3' : 'Цех Б';
      console.log(`    ${display}: ${g.emps.map(e => e.fullName).join(', ')}`);
    }

    // 4. Working days
    const today = utcMidnight(new Date());
    const periodStart = utcMidnight(new Date());
    periodStart.setUTCDate(today.getUTCDate() - 14);

    const days = workingDays(periodStart, today);
    const allWeeks = [...new Set(days.map(d => weekStartKey(d)))].sort();
    const latestWeek = allWeeks[allWeeks.length - 1];

    console.log(`\n  Period: ${periodStart.toISOString().slice(0,10)} → ${today.toISOString().slice(0,10)}`);
    console.log(`  Working days: ${days.length}`);
    console.log(`  Weeks: ${allWeeks.join(', ')}`);
    console.log(`  Week 2 (problem week): ${latestWeek}\n`);

    // 5. Clear existing records for these employees in this period
    const allEmpIds = GROUPS.flatMap(g => g.emps.map(e => e.id));
    const cleared = await prisma.attendance.deleteMany({
      where: {
        companyId: company.id,
        userId: { in: allEmpIds },
        date: { gte: periodStart, lte: today },
      },
    });
    if (cleared.count > 0) {
      console.log(`  Cleared ${cleared.count} existing records for this period.\n`);
    }

    // 6. Generate records
    const summary = [];

    for (const group of GROUPS) {
      if (group.emps.length === 0) {
        console.log(`  Warning: ${group.name} has no employees.`);
        continue;
      }

      let presentCount = 0, lateCount = 0, absentCount = 0;
      let totalLateMin = 0, lateWithSched = 0;

      // Pick absence targets
      const absentKeys = new Set();
      for (let a = 0; a < group.absences; a++) {
        const ei = Math.floor(Math.random() * group.emps.length);
        // Avoid Mondays for absences (keep Monday pattern clean for Цех Б)
        let di = Math.floor(Math.random() * days.length);
        let tries = 0;
        while (days[di].getUTCDay() === 1 && tries < 5) {
          di = Math.floor(Math.random() * days.length);
          tries++;
        }
        absentKeys.add(`${group.emps[ei].id}:${days[di].toISOString().slice(0, 10)}`);
      }

      for (let ei = 0; ei < group.emps.length; ei++) {
        const emp = group.emps[ei];

        // Upsert schedule for Mon–Sun
        const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        const IS_WORK  = [true,  true,  true,  true,  true,  false, false];
        for (let w = 0; w < 7; w++) {
          const pad = (n) => String(n).padStart(2, '0');
          await prisma.employeeSchedule.upsert({
            where: { userId_weekday: { userId: emp.id, weekday: WEEKDAYS[w] } },
            create: {
              id: randomUUID(),
              companyId: company.id,
              userId: emp.id,
              weekday: WEEKDAYS[w],
              isWorkingDay: IS_WORK[w],
              startTime: IS_WORK[w] ? `${pad(group.shiftStart)}:00` : null,
              endTime:   IS_WORK[w] ? `${pad(group.shiftEnd)}:00`   : null,
              autoCheckoutBuffer: 60,
            },
            update: {
              isWorkingDay: IS_WORK[w],
              startTime: IS_WORK[w] ? `${pad(group.shiftStart)}:00` : null,
              endTime:   IS_WORK[w] ? `${pad(group.shiftEnd)}:00`   : null,
            },
          });
        }

        // Per-employee reproducible RNG
        const empSeed = parseInt(emp.id.replace(/-/g, '').slice(0, 8), 16) + ei * 31 + 7;
        const rng = makePrng(empSeed);

        for (let di = 0; di < days.length; di++) {
          const day = days[di];
          const dateStr = day.toISOString().slice(0, 10);
          const key = `${emp.id}:${dateStr}`;
          const dow = day.getUTCDay(); // 1=Mon
          const isMonday = dow === 1;
          const isWeek2 = weekStartKey(day) === latestWeek;

          // ABSENT
          if (absentKeys.has(key)) {
            rng(); rng(); // consume same rng slots to keep later days stable
            await prisma.attendance.create({
              data: {
                id: randomUUID(),
                companyId: company.id,
                userId: emp.id,
                date: utcMidnight(day),
                checkInAt: null,
                checkOutAt: null,
                checkInStatus: null,
                checkOutStatus: null,
                status: 'ABSENT',
                workedMinutes: 0,
                isManual: false,
                note: 'SEEDED',
              },
            });
            absentCount++;
            continue;
          }

          // Lateness decision via rng (ensures correct distribution)
          const lateRoll = rng() * 100;
          const latePct = isWeek2 ? group.lateW2 : group.lateW1;
          const forceLate = group.label === 'C' && isWeek2 && isMonday;
          const isLate = forceLate || lateRoll < latePct;

          // Minutes offset from shift start
          let lateMin;
          if (isLate) {
            if (forceLate) {
              lateMin = randInt(rng, group.lateRangeMon[0], group.lateRangeMon[1]);
            } else if (group.label === 'C' && isWeek2) {
              lateMin = randInt(rng, group.lateRangeW2[0], group.lateRangeW2[1]);
            } else {
              lateMin = randInt(rng, group.lateRange[0], group.lateRange[1]);
            }
          } else {
            lateMin = -randInt(rng, group.earlyRange[0], group.earlyRange[1]);
          }

          const shiftStartMin = group.shiftStart * 60;
          const checkInMin  = shiftStartMin + lateMin;
          const checkOutMin = group.shiftEnd * 60 + randInt(rng, 0, 25);

          const checkInAt  = atMinute(day, checkInMin);
          const checkOutAt = atMinute(day, checkOutMin);
          const workedMinutes = Math.round((checkOutAt - checkInAt) / 60000);

          await prisma.attendance.create({
            data: {
              id: randomUUID(),
              companyId: company.id,
              userId: emp.id,
              date: utcMidnight(day),
              checkInAt,
              checkOutAt,
              checkInStatus: isLate ? 'LATE' : 'ON_TIME',
              checkOutStatus: 'ON_TIME',
              status: isLate ? 'LATE' : 'PRESENT',
              workedMinutes,
              isManual: false,
              note: 'SEEDED',
            },
          });

          if (isLate) {
            lateCount++;
            totalLateMin += lateMin;
            lateWithSched++;
          } else {
            presentCount++;
          }
        }
      }

      const totalPresent = presentCount + lateCount;
      const pct = (n, d) => d > 0 ? Math.round(n / d * 1000) / 10 : 0;
      const punctuality = pct(presentCount, totalPresent);
      const avgLate = lateWithSched > 0 ? Math.round(totalLateMin / lateWithSched) : 0;
      const totalRecs = totalPresent + absentCount;

      const displayName = group.label === 'A' ? 'Цех А' : group.label === 'B' ? 'Стройка №3' : 'Цех Б';
      summary.push({ name: displayName, totalRecs, totalPresent, lateCount, absentCount, punctuality, avgLate });
    }

    // 7. Report
    console.log('\n  ── Results ────────────────────────────────────────────');
    for (const s of summary) {
      console.log(`  ${s.name}:`);
      console.log(`    Records=${s.totalRecs}  Present=${s.totalPresent}  Late=${s.lateCount}  Absent=${s.absentCount}`);
      console.log(`    Punctuality=${s.punctuality}%  Avg lateness=${s.avgLate} min`);
    }

    console.log('\n  Seed complete.');
    console.log('  Next step: POST /insights/regenerate to refresh the AI insight.\n');

  } catch (err) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
