# AI Insights — Reconnaissance Map

## 1. Attendance Model (`Attendance`)

| Field           | Type             | Notes |
|----------------|------------------|-------|
| id             | String (UUID)    | PK |
| companyId      | String           | tenant key |
| userId         | String           | employee FK |
| date           | DateTime         | UTC midnight of the calendar day |
| checkInAt      | DateTime?        | actual arrival timestamp |
| checkOutAt     | DateTime?        | actual departure timestamp |
| checkInStatus  | CheckInStatus?   | ON_TIME / LATE / EARLY_ARRIVAL |
| checkOutStatus | CheckOutStatus?  | ON_TIME / LEFT_EARLY / OVERTIME |
| status         | DayStatus        | PRESENT/LATE/ABSENT/INCOMPLETE/APPROVED_ABSENCE/MANUAL/EARLY_LEAVE/OVERTIME |
| workedMinutes  | Int?             | computed on check-out |
| isManual       | Boolean          | true if admin-created |
| note           | String?          |

DayStatus values used for analytics:
- **Present group**: PRESENT, LATE, EARLY_LEAVE, OVERTIME, MANUAL, INCOMPLETE
- **Absent group**: ABSENT
- **Late subset**: LATE (subset of present group)

The cron at `01:00 UTC` creates ABSENT records for scheduled employees who didn't check in.

## 2. Schedule Model (`EmployeeSchedule`)

| Field              | Type    | Notes |
|--------------------|---------|-------|
| userId             | String  | per-employee override |
| weekday            | Weekday | MON–SUN |
| isWorkingDay       | Boolean |
| startTime          | String? | "HH:mm" local time |
| endTime            | String? | "HH:mm" local time |
| autoCheckoutBuffer | Int     | minutes after endTime before auto-close |

## 3. No Departments

The schema has **no department or team field** on the User model.
The analytics layer uses **day-of-week** as the primary grouping dimension
(analogous to "shifts" or "time segments") and computes week-over-week trends.
This is clearly documented in the generated insight.

## 4. User Model (relevant fields)

| Field     | Type       | Notes |
|-----------|------------|-------|
| companyId | String?    | tenant |
| role      | UserRole   | ADMIN / WORKER |
| status    | UserStatus | ACTIVE / PENDING / WARNING / BLOCKED / DELETED |
| hiredAt   | DateTime?  | hire date |
| deletedAt | DateTime?  | soft-delete |

Active employees: `status IN (ACTIVE, WARNING) AND deletedAt IS NULL`.

## 5. Config / Env Pattern

- Validation: `src/config/env.validation.ts` — Zod schema, `validateEnv()` function
- Access in services: `ConfigService.get<string>('KEY')`
- Template: `backend/.env.example`
- No existing HTTP client beyond native fetch (Node 20+)

New keys added for AI Insights:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## 6. Existing Cron Pattern

`@Cron('30 2 * * *')` — runs daily at 02:30 UTC (after `calculateAbsent` at 01:00).
Cron services run outside HTTP context → **no tenant extension** → must pass `companyId` explicitly in all Prisma queries.

## 7. Caching Pattern

`RedisService` (global module): `get(key)`, `set(key, value, ttlSeconds)`, `del(key)`.
Insight cache key: `insights:v1:{companyId}` — TTL 25 hours.
Persistent storage: `AiInsight` table in Postgres (upsert by companyId).
