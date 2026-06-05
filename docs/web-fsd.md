# SoftTime — ВЕБ: FSD-АРХИТЕКТУРА

# (Feature-Sliced Design для React + Vite + shadcn/ui)

> Архитектура веб-панели по методологии **Feature-Sliced Design (FSD)**. Основано на ТЗ веб-панели (ADMIN + PROVIDER).
> 

---

## 1. ЧТО ТАКОЕ FSD (кратко)

Код делится на **слои** (layers). Слой может импортировать только из **слоёв ниже себя** — это главное правило, оно убирает запутанные зависимости.

Порядок слоёв (сверху вниз):

```
app        → инициализация приложения (провайдеры, роутер, стили)
pages      → страницы (одна страница = один роут)
widgets    → крупные самостоятельные блоки UI (сайдбар, таблица сотрудников)
features   → действия пользователя, несущие ценность (одобрить заявку, оплатить)
entities   → бизнес-сущности (user, company, attendance...)
shared     → переиспользуемая инфраструктура (ui-кит, api-клиент, утилиты)
```

**Правило импортов:** `app → pages → widgets → features → entities → shared`. Никогда наоборот. Слайсы одного слоя не импортируют друг друга напрямую — композиция происходит слоем выше.

**Сегменты внутри слайса:**

- `ui/` — компоненты
- `model/` — состояние, типы, логика (хуки, query, стор)
- `api/` — запросы к backend
- `lib/` — вспомогательные функции слайса
- `config/` — константы слайса
- `index.ts` — публичный API слайса (наружу видно только то, что экспортнули)

---

## 2. КОРНЕВАЯ СТРУКТУРА

```
/src
  /app
  /pages
  /widgets
  /features
  /entities
  /shared
  main.tsx
```

---

## 3. СЛОЙ app

Инициализация всего приложения.

```
/app
  /providers
    QueryProvider.tsx       — TanStack Query client
    RouterProvider.tsx      — React Router v7
    ThemeProvider.tsx       — Tailwind / shadcn тема
    AuthProvider.tsx        — контекст текущего пользователя (роль)
    index.tsx               — композиция всех провайдеров
  /router
    routes.tsx              — описание роутов
    guards.tsx              — RoleGuard (ADMIN / PROVIDER), AuthGuard
  /styles
    globals.css             — Tailwind directives + дизайн-токены (CSS vars)
  App.tsx
```

`guards.tsx` реализует из ТЗ: нет токена → Login; ADMIN на роуте PROVIDER → 403/редирект на свой дашборд.

---

## 4. СЛОЙ pages

Одна страница = один роут. Страница тонкая — она **компонует widgets**, не содержит бизнес-логики.

```
/pages
  /auth
    LoginPage.tsx
    RegisterCompanyPage.tsx
  /admin
    DashboardPage.tsx
    EmployeesPage.tsx
    EmployeeDetailPage.tsx
    AttendancePage.tsx
    SchedulesPage.tsx
    RequestsPage.tsx
    NewsPage.tsx
    OfficeNetworksPage.tsx
    QrPage.tsx
    ReportsPage.tsx
    SubscriptionPage.tsx
    AuditLogPage.tsx
    SettingsPage.tsx
  /provider
    ProviderDashboardPage.tsx
    CompaniesPage.tsx
    CompanyDetailPage.tsx
    PaymentsPage.tsx
  index.ts
```

Пример: `EmployeesPage` = `<PageHeader/>` + `<EmployeesFilters/>` + `<EmployeesTable/>` (всё это widgets).

---

## 5. СЛОЙ widgets

Крупные самостоятельные блоки, собранные из features + entities.

```
/widgets
  /app-sidebar          — сайдбар (разный для ADMIN/PROVIDER)
    /ui SidebarAdmin.tsx, SidebarProvider.tsx
    /model nav-items.ts
  /app-topbar           — топбар (breadcrumb + меню пользователя)
  /dashboard-metrics    — карточки-метрики (всего, в офисе, ожидают, заявки)
  /who-in-office        — виджет «Сейчас в офисе» + ручная отметка ухода
  /attendance-chart     — график посещаемости за неделю (Recharts)
  /employees-table      — таблица сотрудников + фильтры + действия по строке
  /attendance-table     — таблица посещаемости + фильтры + ручные правки
  /schedule-editor      — редактор недельного графика (7 дней) + «один для всех»
  /requests-table       — таблица заявок + approve/reject
  /news-manager         — список новостей + создание + read-tracking
  /office-networks-table— CRUD сетей
  /qr-panel             — отображение QR + регенерация
  /reports-view         — фильтры + показатели + таблица + экспорт + графики
  /subscription-card    — статус подписки + кнопка оплаты + история
  /audit-table          — таблица аудит-лога
  /companies-table      — (PROVIDER) все компании + activate/suspend
  /company-detail       — (PROVIDER) инфо + подписка + сотрудники + платежи
  /payments-table       — (PROVIDER) все платежи + сводка + экспорт
  /platform-metrics     — (PROVIDER) MRR, кол-во компаний, графики
  index.ts
```

---

## 6. СЛОЙ features

Действие пользователя = одна feature. Содержит UI-триггер (кнопка/форма) + логику действия (mutation).

```
/features
  /auth
    /login              — форма входа + useLogin()
    /register-company   — форма регистрации компании
    /logout
    /refresh-token      — перехватчик (model/interceptor.ts)
  /employee
    /approve-employee   — кнопка «Принять» + mutation
    /reject-employee
    /change-employee-status — активировать/заблокировать
    /soft-delete-employee
    /edit-admin-note
  /schedule
    /edit-schedule          — сохранить график (валидация ≥6ч в model/)
    /apply-schedule-to-all  — «один для всех»
  /attendance
    /fix-attendance         — ручная правка времени/статуса
    /manual-checkout        — указать уход за забывшего
    /add-absence            — добавить отсутствие с причиной
  /request
    /approve-request
    /reject-request         — с комментарием
  /news
    /create-news            — форма + mutation + push-триггер на backend
  /office-network
    /manage-office-network  — add/edit/delete
  /qr
    /regenerate-qr
  /report
    /export-report          — CSV/Excel
  /subscription
    /pay-subscription
    /cancel-subscription
  /provider
    /activate-company
    /suspend-company        — AlertDialog подтверждение
  index.ts
```

Внутри каждой feature, напр. `/features/request/approve-request`:

```
/ui ApproveRequestButton.tsx
/model useApproveRequest.ts   — useMutation + invalidate queries
/index.ts
```

---

## 7. СЛОЙ entities

Бизнес-сущности: типы, базовые карточки/строки, запросы на чтение.

```
/entities
  /user
    /model types.ts (UserRole, UserStatus, User), mappers
    /api getUsers, getUserById
    /ui UserRow.tsx, UserStatusBadge.tsx, UserAvatar.tsx
  /company
    /model types.ts (CompanyStatus, Company)
    /api getMyCompany, getCompanies (provider)
    /ui CompanyStatusBadge.tsx
  /attendance
    /model types.ts (DayStatus, CheckInStatus...), helpers (formatWorked)
    /api getAttendance, getMyAttendance, getTodayInOffice
    /ui AttendanceRow.tsx, DayStatusBadge.tsx
  /schedule
    /model types.ts (EmployeeSchedule, Weekday), validateMinHours()
    /api getSchedule, getMySchedule
    /ui ScheduleDayRow.tsx
  /request
    /model types.ts (RequestType, RequestStatus, AbsenceRequest)
    /api getRequests, getMyRequests
    /ui RequestRow.tsx, RequestTypeChip.tsx, RequestStatusBadge.tsx
  /news
    /model types.ts (News, NewsRead)
    /api getNews, getNewsById, getNewsReads
    /ui NewsRow.tsx
  /office-network
    /model types.ts (OfficeNetwork)
    /api getOfficeNetworks
  /qr
    /model types.ts (QrToken)
    /api getActiveQr
  /payment
    /model types.ts (Payment, PaymentStatus)
    /api getPayments
    /ui PaymentRow.tsx
  /subscription
    /model types.ts (Subscription, SubStatus)
    /api getMySubscription
    /ui SubscriptionStatusBadge.tsx
  /audit-log
    /model types.ts (AuditLog)
    /api getAuditLogs
    /ui AuditRow.tsx
  index.ts
```

> Все типы и Zod-схемы переиспользуются из `/packages/shared` — в `entities/*/model` импортируются оттуда, а не дублируются.
> 

---

## 8. СЛОЙ shared

Переиспользуемая инфраструктура без бизнес-смысла.

```
/shared
  /ui                — обёртки над shadcn/ui + кастомные компоненты дизайн-системы
    button.tsx, input.tsx, card.tsx, badge.tsx, dialog.tsx, sheet.tsx,
    data-table.tsx (TanStack Table обёртка), date-picker.tsx,
    skeleton.tsx, empty-state.tsx, error-state.tsx, toast.tsx,
    status-badge.tsx (единая система статусов из дизайн-ТЗ)
  /api
    client.ts          — Axios инстанс + baseURL /api/v1
    interceptors.ts    — refresh-токен на 401
    query-keys.ts      — централизованные ключи TanStack Query
  /lib
    date.ts            — date-fns обёртки
    format.ts          — форматирование часов, валют, статусов в человекочитаемый текст
    cn.ts              — className merge (clsx + tailwind-merge)
  /config
    routes.ts          — пути роутов (типизированные)
    env.ts             — переменные окружения
    design-tokens.ts   — цвета/отступы (если не только в CSS)
  /types
    common.ts          — Paginated<T>, ApiError и т.д.
  index.ts
```

---

## 9. ПОЛНОЕ ДЕРЕВО (сводка)

```
/src
  /app          providers, router(guards), styles
  /pages        auth/ admin/ provider/
  /widgets      sidebar, topbar, *-table, schedule-editor, subscription-card, ...
  /features     auth/ employee/ schedule/ attendance/ request/ news/ qr/ subscription/ provider/
  /entities     user company attendance schedule request news office-network qr payment subscription audit-log
  /shared       ui api lib config types
  main.tsx
```

---

## 10. ПРИМЕР ПОТОКА (одобрение заявки)

1. `pages/admin/RequestsPage` рендерит `widgets/requests-table`
2. `widgets/requests-table` берёт данные через `entities/request/api` (`getRequests`) и рисует строки `entities/request/ui/RequestRow`
3. В каждой строке кнопка из `features/request/approve-request`
4. `features/request/approve-request/model/useApproveRequest` делает mutation → инвалидирует query-ключ `requests`
5. Таблица автоматически обновляется (TanStack Query)

Зависимости идут строго вниз: page → widget → feature → entity → shared.

---

## 11. ПРАВИЛА И КОНВЕНЦИИ

- **Публичный API:** наружу слайса экспортировать только через `index.ts`. Внутренние файлы не импортировать напрямую из других слайсов.
- **Нет cross-import** между слайсами одного слоя (две features не импортируют друг друга). Нужна общая логика → опускаем в `entities` или `shared`.
- **Бизнес-логику** держать в `model/`, не в `ui/`. Компонент только показывает.
- **Zod-схемы** — единый источник в `/packages/shared`, импорт в `entities` и формы.
- **Имена слайсов** — по бизнес-смыслу (`approve-request`), не по типу компонента.
- **Tenant-изоляция** обеспечивается backend; фронт просто не показывает чужого, но не считается доверенной стороной.
- **Роутинг по роли:** `app/router/guards` пускает ADMIN только на `/admin/*`, PROVIDER только на `/provider/*`.

---

## 12. КАРТА «ТЗ → FSD»

| Раздел ТЗ | Где в FSD |
| --- | --- |
| Вход / регистрация компании | `pages/auth` + `features/auth` + `entities/user,company` |
| Дашборд (метрики, в офисе, график) | `pages/admin/DashboardPage` + `widgets/dashboard-metrics, who-in-office, attendance-chart` |
| Сотрудники + профиль | `pages/admin/Employees*` + `widgets/employees-table` + `features/employee/*` + `entities/user` |
| Посещаемость + ручные правки | `widgets/attendance-table` + `features/attendance/*` + `entities/attendance` |
| Расписания (индивид./массово) | `widgets/schedule-editor` + `features/schedule/*` + `entities/schedule` |
| Заявки | `widgets/requests-table` + `features/request/*` + `entities/request` |
| Новости + read-tracking | `widgets/news-manager` + `features/news/create-news` + `entities/news` |
| Офисные сети | `widgets/office-networks-table` + `features/office-network` + `entities/office-network` |
| QR-коды | `widgets/qr-panel` + `features/qr/regenerate-qr` + `entities/qr` |
| Отчёты + экспорт | `widgets/reports-view` + `features/report/export-report` + `entities/attendance` |
| Подписка и оплата | `widgets/subscription-card` + `features/subscription/*` + `entities/subscription,payment` |
| Аудит-лог | `widgets/audit-table` + `entities/audit-log` |
| PROVIDER: компании/оплаты | `pages/provider/*` + `widgets/companies-table, payments-table, platform-metrics` + `features/provider/*` |