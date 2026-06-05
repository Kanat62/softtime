# SoftTime — BACKEND

# ТЕХНИЧЕСКОЕ ЗАДАНИЕ (NestJS — Июнь 2026)

> Backend для мультитенантной SaaS-платформы SoftTime. Обслуживает мобильное приложение (WORKER, ADMIN) и веб-панель (ADMIN, PROVIDER). Все эндпоинты под `/api/v1/...`.
> 

---

## 1. СТЕК

| Слой | Технология |
| --- | --- |
| Фреймворк | NestJS (TypeScript) |
| ORM | Prisma + PostgreSQL |
| Кэш / сессии | Redis (refresh-токены, brute-force, rate-limit) |
| Валидация | Zod (через `nestjs-zod`), схемы из `/packages/shared` |
| Auth | JWT (access + refresh), bcrypt |
| Cron | `@nestjs/schedule` (APScheduler-аналог) |
| Push | Firebase Admin SDK (FCM) |
| Деплой | Docker Compose + Nginx |
| Документация API | Swagger (`@nestjs/swagger`) |

---

## 2. АРХИТЕКТУРА

### 2.1 Модульная структура

```
/src
  /modules
    /auth            — регистрация, вход, refresh, logout, guards
    /companies       — компании, код компании
    /users           — пользователи, профиль, управление
    /schedules       — расписания (индивид. + массово)
    /attendance      — check-in/out, ручные правки, «сейчас в офисе»
    /requests        — заявки (отсутствие / ранний уход)
    /office-networks — офисные сети (IP)
    /qr              — QR-коды
    /news            — новости + read-tracking
    /reports         — отчёты
    /subscriptions   — подписка, платежи, webhook
    /provider        — панель платформы (cross-tenant)
    /notifications   — FCM, device-токены
    /audit           — аудит-лог
    /settings        — настройки компании
  /common
    /guards          — JwtAuthGuard, RolesGuard, StatusGuard, CompanyActiveGuard
    /interceptors    — TenantInterceptor, AuditInterceptor
    /decorators      — @Roles, @CurrentUser, @Public
    /tenant          — TenantContext (AsyncLocalStorage)
  /prisma            — PrismaService + Client Extensions
  /config            — env-конфиг (ConfigModule)
  main.ts
```

### 2.2 Слои внутри модуля

`controller` (HTTP, валидация Zod) → `service` (бизнес-логика) → `prisma` (доступ к данным). Контроллер не содержит логики, сервис не знает про HTTP.

---

## 3. МУЛЬТИТЕНАНТНОСТЬ (ключевая часть)

Все данные изолируются по `company_id`. Реализация в три уровня:

**1. Контекст запроса.** После авторизации `TenantInterceptor` кладёт `{ userId, role, companyId }` из JWT в `TenantContext` (AsyncLocalStorage), доступный во всех сервисах текущего запроса.

**2. Авто-скоупинг Prisma.** Через **Prisma Client Extensions** все запросы к tenant-таблицам автоматически получают `where: { companyId }` из контекста. Разработчик не пишет `companyId` вручную — это исключает утечку между компаниями из-за забытого фильтра.

**3. Защита на уровне БД (рекомендуется).** Postgres Row-Level Security (RLS) по `company_id` как «защита от дурака» поверх приложения.

**Исключение — PROVIDER.** У PROVIDER `companyId = null`. Для его эндпоинтов (`/provider/...`) авто-скоупинг отключается (cross-tenant доступ). Это разрешено только под `RolesGuard(['PROVIDER'])`.

**Правило:** ни один tenant-эндпоинт не возвращает данные другой компании. Проверка — на backend, фронт не доверенная сторона.

---

## 4. БЕЗОПАСНОСТЬ И AUTH

### 4.1 Пароли

- bcrypt, cost factor **12**
- Минимум **8 символов** (валидация Zod)
- bcrypt обрезает >72 байт — ограничить длину на валидации

### 4.2 JWT

- **Access token** — 15 минут. Payload: `{ sub: userId, role, companyId }`
- **Refresh token** — 30 дней, хранится в **Redis** (ключ `refresh:{userId}:{tokenId}`), что позволяет инвалидировать при logout/блокировке
- Ротация refresh-токена при каждом обновлении (опционально, рекомендуется)

### 4.3 Brute-force защита

- Счётчик неудачных входов в Redis по email/IP
- После N попыток (напр. 5) — временная блокировка (напр. 15 мин), ответ 429

### 4.4 Guards (порядок применения)

1. `JwtAuthGuard` — валидный access-токен (кроме `@Public`)
2. `RolesGuard` — проверка роли (`@Roles('ADMIN')` и т.д.)
3. `StatusGuard` — пользователь не `BLOCKED` / не `PENDING` (для защищённых действий)
4. `CompanyActiveGuard` — для эндпоинтов посещаемости: компания не `SUSPENDED` (иначе 403 «подписка не оплачена»)

### 4.5 Регистрация

- **ADMIN (создание компании):** транзакция — создать `company` (статус `TRIAL`, сгенерировать `company_code`) + `user` (роль ADMIN) + `subscription` (TRIAL, период 30 дней). Доступно с мобайла и веба.
- **WORKER (по коду):** найти компанию по `company_code` (ровно 6 символов); нет → 404 «компания не найдена»; есть → создать `user` (роль WORKER, статус `PENDING`, `companyId`). Только мобайл.
- Email уникален в рамках компании.

---

## 5. БАЗА ДАННЫХ (Prisma schema)

### 5.1 Enums

```
enum UserRole       { PROVIDER ADMIN WORKER }
enum UserStatus     { PENDING ACTIVE WARNING BLOCKED DELETED }
enum CompanyStatus  { TRIAL ACTIVE GRACE SUSPENDED }
enum SubStatus      { TRIAL ACTIVE EXPIRED GRACE CANCELLED }
enum CheckInStatus  { ON_TIME LATE EARLY_ARRIVAL }
enum CheckOutStatus { ON_TIME LEFT_EARLY OVERTIME }
enum DayStatus      { PRESENT LATE ABSENT INCOMPLETE APPROVED_ABSENCE MANUAL EARLY_LEAVE OVERTIME }
enum RequestType    { SICK FAMILY VACATION BUSINESS_TRIP REMOTE LATE_REASON EARLY_LEAVE OTHER }
enum RequestStatus  { PENDING APPROVED REJECTED }
enum PaymentStatus  { PENDING PAID FAILED }
enum Weekday        { MON TUE WED THU FRI SAT SUN }
```

> `RequestType` → поведение при одобрении:
`SICK/FAMILY/VACATION/BUSINESS_TRIP/REMOTE` → дни помечаются `APPROVED_ABSENCE`;
`EARLY_LEAVE` → ранний уход в этот день не штрафуется;
`LATE_REASON/OTHER` → служат для истории, статус дня не меняют.
> 

### 5.2 Модели (ключевые поля)

```
model Company {
  id            String        @id @default(uuid())
  name          String
  companyCode   String        @unique        // 6 символов
  status        CompanyStatus @default(TRIAL)
  createdAt     DateTime      @default(now())
  deletedAt     DateTime?
  users         User[]
  subscription  Subscription?
  // ...связи
}

model Subscription {
  id            String     @id @default(uuid())
  companyId     String     @unique
  status        SubStatus  @default(TRIAL)
  priceUsd      Decimal    @default(30)
  periodStart   DateTime
  periodEnd     DateTime
  nextBillingAt DateTime?
  company       Company    @relation(fields: [companyId], references: [id])
  payments      Payment[]
}

model Payment {
  id             String        @id @default(uuid())
  companyId      String
  subscriptionId String
  amountUsd      Decimal
  periodStart    DateTime
  periodEnd      DateTime
  status         PaymentStatus @default(PENDING)
  provider       String?       // имя шлюза
  providerRef    String?       // id транзакции у провайдера
  createdAt      DateTime      @default(now())
}

model User {
  id          String      @id @default(uuid())
  companyId   String?     // null только у PROVIDER
  role        UserRole
  status      UserStatus  @default(PENDING)
  fullName    String
  email       String
  passwordHash String
  avatarUrl   String?
  hiredAt     DateTime?
  adminNote   String?
  deletedAt   DateTime?
  createdAt   DateTime    @default(now())
  @@unique([companyId, email])
}

model EmployeeSchedule {
  id                 String   @id @default(uuid())
  companyId          String
  userId             String
  weekday            Weekday
  isWorkingDay       Boolean  @default(true)
  startTime          String?  // "10:15"
  endTime            String?  // "18:00"
  autoCheckoutBuffer Int      @default(60)  // минуты, по умолчанию +60
  @@unique([userId, weekday])
}

model Attendance {
  id              String          @id @default(uuid())
  companyId       String
  userId          String
  date            DateTime        // дата дня
  checkInAt       DateTime?
  checkOutAt      DateTime?
  checkInStatus   CheckInStatus?
  checkOutStatus  CheckOutStatus?
  status          DayStatus
  workedMinutes   Int?
  isManual        Boolean         @default(false)
  note            String?
  @@unique([userId, date])
}

model AbsenceRequest {
  id          String        @id @default(uuid())
  companyId   String
  userId      String
  type        RequestType
  startDate   DateTime
  endDate     DateTime?
  desiredTime String?       // для раннего ухода
  comment     String?
  status      RequestStatus @default(PENDING)
  decidedBy   String?       // adminId
  decisionNote String?
  createdAt   DateTime      @default(now())
}

model OfficeNetwork {
  id        String @id @default(uuid())
  companyId String
  label     String
  cidr      String   // "192.168.1.0/24" или одиночный IP
}

model QrToken {
  id              String  @id @default(uuid())
  companyId       String
  officeNetworkId String?
  token           String  @unique  // зашифрованный
  isActive        Boolean @default(true)
  createdAt       DateTime @default(now())
}

model News {
  id        String   @id @default(uuid())
  companyId String
  title     String
  body      String
  photoUrl  String?
  createdBy String
  createdAt DateTime @default(now())
  reads     NewsRead[]
}

model NewsRead {
  id        String   @id @default(uuid())
  newsId    String
  userId    String
  readAt    DateTime @default(now())
  @@unique([newsId, userId])
}

model AuditLog {
  id         String   @id @default(uuid())
  companyId  String?
  actorId    String
  action     String   // "REQUEST_APPROVED", "ATTENDANCE_MANUAL_FIX"
  entityType String
  entityId   String?
  meta       Json?
  createdAt  DateTime @default(now())
}

model WorkSettings {
  id                   String @id @default(uuid())
  companyId            String @unique
  minWorkdayHours      Int    @default(6)
  defaultCheckoutBuffer Int   @default(60)
}

model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  fcmToken  String
  platform  String   // ios / android
  createdAt DateTime @default(now())
}
```

> **Все tenant-таблицы** имеют `companyId` и используют авто-скоупинг (п. 3). Soft delete через `deletedAt` — кроме `OfficeNetwork` и `QrToken` (физическое удаление, т.к. конфигурация).
> 

---

## 6. БИЗНЕС-ЛОГИКА (сервисы)

### 6.1 Посещаемость — Check-In

`POST /attendance/check-in` (WORKER/ADMIN):

1. `CompanyActiveGuard` — если компания `SUSPENDED` → 403
2. Проверить **QR**: расшифровать токен из тела, найти активный `QrToken` компании; не совпал → 400 «QR недействителен»
3. Проверить **IP**: source IP запроса (за Nginx — `X-Forwarded-For`) ∈ одной из `office_networks` компании (CIDR-match); нет → 400 «вне офисной сети»
4. Взять расписание (`EmployeeSchedule`) на сегодняшний `weekday`; выходной → 400
5. Рассчитать `checkInStatus`:
    - `now < startTime − 5мин` → `EARLY_ARRIVAL`
    - `|now − startTime| ≤ 5мин` → `ON_TIME`
    - `now > startTime + 5мин` → `LATE`
6. Создать/обновить `Attendance` (uniq `userId+date`), `checkInAt = now`
7. Вернуть статус + человекочитаемую разницу («опоздал на X мин»)

### 6.2 Посещаемость — Check-Out

`POST /attendance/check-out`:

1. Те же проверки QR + IP + компания
2. Найти сегодняшнюю запись с `checkInAt`, без `checkOutAt`
3. Рассчитать `checkOutStatus`:
    - `now < endTime − 5мин` → `LEFT_EARLY` (но если на сегодня есть одобренная заявка `EARLY_LEAVE` → не штрафовать, статус дня `EARLY_LEAVE` approved)
    - `|now − endTime| ≤ 5мин` → `ON_TIME`
    - `now > endTime + 5мин` → `OVERTIME`
4. `checkOutAt = now`, рассчитать `workedMinutes`, итоговый `status` дня

### 6.3 Cron — автозакрытие смены

`@Cron` каждые 15–30 минут:

1. Найти `Attendance` с `checkInAt`, без `checkOutAt`, у кого `now > date + endTime + autoCheckoutBuffer`
2. Поставить `checkOutAt = endTime` (конец смены по графику), `status = INCOMPLETE`
3. Уведомить ADMIN (список не закрывших смену)

### 6.4 Cron — расчёт ABSENT

`@Cron` (раз в сутки, после автозакрытия): для рабочих дней без записи посещаемости и без одобренного отсутствия → создать `Attendance` со `status = ABSENT`.

### 6.5 Заявки

- `POST /requests` (worker/admin для себя): создать `AbsenceRequest` (PENDING), push ADMIN
- `PATCH /requests/:id/approve` | `/reject` (ADMIN): сменить статус, push инициатору, лог в audit
- При `APPROVE`:
    - типы-отсутствия → проставить `APPROVED_ABSENCE` на дни периода в `Attendance`
    - `EARLY_LEAVE` → пометить день как одобренный ранний уход (учитывается в check-out)

### 6.6 Расписания

- `PUT /schedules/:userId` (ADMIN): сохранить 7 дней. Валидация: для рабочего дня `endTime − startTime ≥ minWorkdayHours` (6 ч), иначе 422
- `POST /schedules/apply-all` (ADMIN): применить переданный шаблон ко всем (или списку) сотрудникам — у каждого создаётся/перезаписывается своя копия

### 6.7 Подписка и платежи

- Новая компания → `Subscription` TRIAL на 30 дней
- `@Cron` (раз в сутки) переводит статусы: `TRIAL/ACTIVE` с истёкшим `periodEnd` → `GRACE`; `GRACE` дольше N дней (напр. 7) → `EXPIRED` + компания `SUSPENDED`; шлёт напоминания ADMIN
- `POST /subscriptions/pay` (ADMIN): инициировать оплату $30 через абстрактный `PaymentProvider` (интерфейс), вернуть ссылку/токен оплаты
- `POST /webhooks/payments` (public, проверка подписи провайдера): при успехе → создать `Payment(PAID)`, продлить период, компания → `ACTIVE`, push PROVIDER «поступила оплата»
- **Абстракция:** интерфейс `PaymentProvider { createCheckout(), verifyWebhook() }` — конкретный шлюз подключается позже без переделки логики

### 6.8 QR

- `POST /qr/regenerate` (ADMIN): создать новый зашифрованный токен, привязать к офисной сети, деактивировать старый
- `GET /qr` (ADMIN): получить активный QR для отображения/печати

### 6.9 Аудит

`AuditInterceptor` или явный `AuditService.log()` фиксирует все действия ADMIN/PROVIDER (одобрения, правки посещаемости, блокировки, регенерация QR, изменения подписки): `actorId`, `action`, `entityType`, `entityId`, `meta`, `createdAt`.

### 6.10 Уведомления (FCM)

- `POST /devices` — регистрация FCM-токена при логине; `DELETE /devices/:token` — при логауте
- Триггеры push (см. таблицу в п. 8)

---

## 7. API ЭНДПОИНТЫ

> Все под `/api/v1`. Доступ: 🟢 WORKER, 🔵 ADMIN, 🟣 PROVIDER, ⚪ public.
> 

### Auth

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| POST | `/auth/register/company` | ⚪ | Регистрация ADMIN + компании |
| POST | `/auth/register/worker` | ⚪ | Регистрация WORKER по коду |
| POST | `/auth/login` | ⚪ | Вход (email+пароль) |
| POST | `/auth/refresh` | ⚪ | Обновить access по refresh |
| POST | `/auth/logout` | 🟢🔵🟣 | Инвалидация refresh + FCM |

### Companies / Users

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| GET | `/companies/me` | 🔵 | Своя компания + код |
| GET | `/users` | 🔵 | Список сотрудников (фильтр статус, поиск) |
| GET | `/users/:id` | 🔵 | Профиль сотрудника + история |
| PATCH | `/users/:id/approve` | 🔵 | PENDING → ACTIVE |
| PATCH | `/users/:id/reject` | 🔵 | Отклонить регистрацию |
| PATCH | `/users/:id/status` | 🔵 | Сменить статус (block/active) |
| PATCH | `/users/:id/note` | 🔵 | Admin-комментарий |
| DELETE | `/users/:id` | 🔵 | Soft delete |
| GET | `/profile` | 🟢🔵 | Свой профиль |
| PATCH | `/profile` | 🟢🔵 | Аватар, смена пароля |

### Schedules

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| GET | `/schedules/me` | 🟢🔵 | Своё расписание |
| GET | `/schedules/:userId` | 🔵 | Расписание сотрудника |
| PUT | `/schedules/:userId` | 🔵 | Сохранить (валидация ≥6ч) |
| POST | `/schedules/apply-all` | 🔵 | Применить шаблон всем |

### Attendance

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| POST | `/attendance/check-in` | 🟢🔵 | Приход (QR+IP) |
| POST | `/attendance/check-out` | 🟢🔵 | Уход (QR+IP) |
| GET | `/attendance/me` | 🟢🔵 | Своя история (период) |
| GET | `/attendance/today` | 🔵 | «Сейчас в офисе» |
| GET | `/attendance` | 🔵 | Посещаемость компании (фильтры) |
| PATCH | `/attendance/:id` | 🔵 | Ручная правка времени/статуса |
| POST | `/attendance/manual` | 🔵 | Создать запись/отсутствие вручную |

### Requests

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| POST | `/requests` | 🟢🔵 | Подать заявку |
| GET | `/requests/me` | 🟢🔵 | Свои заявки |
| GET | `/requests` | 🔵 | Входящие заявки (фильтр) |
| PATCH | `/requests/:id/approve` | 🔵 | Одобрить |
| PATCH | `/requests/:id/reject` | 🔵 | Отклонить (с комментарием) |

### News

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| GET | `/news` | 🟢🔵 | Лента компании |
| GET | `/news/:id` | 🟢🔵 | Детали (триггерит read) |
| POST | `/news/:id/read` | 🟢🔵 | Отметить прочитанной |
| POST | `/news` | 🔵 | Создать новость + push |
| GET | `/news/:id/reads` | 🔵 | Кто прочитал / нет |

### Office Networks / QR

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| GET/POST/PATCH/DELETE | `/office-networks` | 🔵 | CRUD сетей (физ. удаление) |
| GET | `/qr` | 🔵 | Активный QR |
| POST | `/qr/regenerate` | 🔵 | Регенерация QR |

### Reports / Settings / Audit

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| GET | `/reports/attendance` | 🔵 | Отчёт (фильтры, показатели) |
| GET | `/reports/attendance/export` | 🔵 | Экспорт CSV |
| GET/PATCH | `/settings` | 🔵 | Настройки компании |
| GET | `/audit-logs` | 🔵 | Аудит-лог компании |

### Subscriptions / Payments

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| GET | `/subscriptions/me` | 🔵 | Статус подписки |
| POST | `/subscriptions/pay` | 🔵 | Инициировать оплату $30 |
| POST | `/subscriptions/cancel` | 🔵 | Отменить подписку |
| GET | `/payments` | 🔵 | История платежей компании |
| POST | `/webhooks/payments` | ⚪ | Webhook провайдера (подпись) |

### Provider (cross-tenant)

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| GET | `/provider/dashboard` | 🟣 | Метрики платформы (MRR и т.д.) |
| GET | `/provider/companies` | 🟣 | Все компании (фильтры) |
| GET | `/provider/companies/:id` | 🟣 | Детали компании + сотрудники |
| PATCH | `/provider/companies/:id/activate` | 🟣 | Активировать |
| PATCH | `/provider/companies/:id/suspend` | 🟣 | Приостановить |
| GET | `/provider/payments` | 🟣 | Все платежи / выручка |

### Devices (FCM)

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| POST | `/devices` | 🟢🔵🟣 | Регистрация push-токена |
| DELETE | `/devices/:token` | 🟢🔵🟣 | Удаление токена |

---

## 8. PUSH-СОБЫТИЯ (FCM)

| Событие | Получатель | Триггер |
| --- | --- | --- |
| Новый сотрудник ждёт подтверждения | ADMIN | регистрация WORKER |
| Заявка подана | ADMIN | `POST /requests` |
| Заявка одобрена/отклонена | Инициатор | решение по заявке |
| Новость опубликована | Сотрудники компании | `POST /news` |
| Не закрыл смену (автозакрытие) | ADMIN | cron автозакрытия |
| Подписка истекает / не оплачена | ADMIN | cron подписки |
| Компания приостановлена | ADMIN | переход в SUSPENDED |
| Новая компания / поступила оплата | PROVIDER | регистрация / webhook |
| Регистрация одобрена/отклонена | WORKER | approve/reject |

---

## 9. ВАЛИДАЦИЯ И ОШИБКИ

- Валидация входных данных через **Zod** (`nestjs-zod` pipe), схемы переиспользуются с фронтом из `/packages/shared`
- Единый формат ошибки: `{ statusCode, message, error, details? }`
- Глобальный `ExceptionFilter`
- Коды: 400 (валидация/QR/IP), 401 (нет/невалидный токен), 403 (роль/SUSPENDED/blocked), 404 (не найдено), 409 (конфликт, напр. уже отметился), 422 (бизнес-правило, напр. <6ч), 429 (brute-force/rate-limit)

---

## 10. БИЗНЕС-ПРАВИЛА (контроль на backend)

1. UUID PK везде
2. Tenant-изоляция по `company_id` (авто-скоупинг + RLS)
3. Подписку платит только ADMIN; $30/мес; TRIAL → GRACE → SUSPENDED; оплата → ACTIVE
4. SUSPENDED → check-in/out недоступны (`CompanyActiveGuard`)
5. Soft delete (`deletedAt`), кроме office_networks / qr
6. bcrypt cost 12, пароль ≥ 8
7. JWT access 15 мин / refresh 30 дней (Redis), токен содержит `companyId`
8. Минимум рабочего дня 6 ч — ошибка при сохранении < 6 ч
9. Посещаемость = QR + IP (оба обязательны)
10. Автозакрытие = endTime + buffer; ставит уход = endTime, статус INCOMPLETE
11. Все действия ADMIN/PROVIDER → `audit_logs`
12. Один ADMIN на компанию; роли не меняются
13. `company_code` — 6 символов, уникален, без регенерации

---

## 11. НЕФУНКЦИОНАЛЬНЫЕ

- **Конфиг:** все секреты через `.env` (DB, Redis, JWT secret, FCM ключ, payment ключи), `ConfigModule` с валидацией
- **Деплой:** Docker Compose (Postgres, Redis, API) + Nginx reverse proxy; миграции `prisma migrate deploy`
- **Логирование:** структурированные логи (pino), без чувствительных данных
- **Документация:** Swagger на `/api/docs`
- **Тесты:** unit для сервисов (расчёт статусов, подписка), e2e для auth и attendance; критичный путь — мультитенант-изоляция
- **Производительность:** индексы на `companyId`, `userId+date`, `companyCode`; пагинация во всех списках
- **Часовые пояса:** хранить время в UTC; расчёт статусов — в часовом поясе компании (поле `timezone` у Company — добавить при необходимости)

---

## 12. ОТКРЫТЫЕ ТЕХ-ВОПРОСЫ

1. **Часовой пояс компании** — нужен для корректного расчёта опозданий/автозакрытия у компаний в разных зонах. Рекомендуется добавить `Company.timezone`.
2. **Хранение аватаров/фото новостей** — локально, S3-совместимое хранилище или CDN (определить).
3. **Платёжный провайдер** — конкретный шлюз позже; интерфейс `PaymentProvider` готовится заранее.
4. **Длительность GRACE** — сколько дней льготы до SUSPENDED (бизнес-решение, напр. 7).