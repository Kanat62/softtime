# SoftTime — МОБАЙЛ: FSD-АРХИТЕКТУРА

# (Feature-Sliced Design для React Native)

> Архитектура мобильного приложения по методологии **Feature-Sliced Design (FSD)**, адаптированной под React Native. Основано на ТЗ мобильного приложения (WORKER + ADMIN).
> 

---

## 1. FSD В REACT NATIVE (отличия от веба)

Слои те же, но с поправками на мобайл:

```
app        → инициализация (провайдеры, навигация, шрифты, токены)
screens    → экраны (вместо web-слоя "pages")
widgets    → крупные блоки UI (блок посещаемости, сотрудники сегодня)
features   → действия (check-in, подать заявку, одобрить, оплатить)
entities   → бизнес-сущности (user, attendance, request...)
shared     → ui-кит RN, api-клиент, навигация, утилиты
```

**Главные отличия от веба:**

- `pages` → **`screens`** (термин React Navigation)
- Навигация (React Navigation v7) живёт в `app/navigation` + типы маршрутов в `shared`
- `shared/ui` — нативные компоненты (View/Text/Pressable), не HTML
- Нет роутера-URL; есть стеки и табы
- Гарды реализуются через условный рендер навигаторов (по статусу/роли)

**Правило импортов то же:** `app → screens → widgets → features → entities → shared`. Только вниз.

---

## 2. КОРНЕВАЯ СТРУКТУРА

```
/src
  /app
  /screens
  /widgets
  /features
  /entities
  /shared
  App.tsx
```

---

## 3. СЛОЙ app

```
/app
  /providers
    QueryProvider.tsx        — TanStack Query
    AuthProvider.tsx         — текущий пользователь, роль, статус
    FontsProvider.tsx        — загрузка Manrope (expo-font)
    index.tsx
  /navigation
    RootNavigator.tsx        — выбор навигатора по состоянию (см. гарды)
    AuthNavigator.tsx        — Splash, Onboarding, RoleSelect, Register*, Login
    WorkerTabs.tsx           — табы WORKER (Главная/Новости/Заявки/Профиль)
    AdminTabs.tsx            — табы ADMIN (Главная/Новости/Заявки/Профиль(+Управление))
    PendingStack.tsx         — экран ожидания подтверждения
    BlockedStack.tsx         — экран блокировки
    linking.ts               — deep links для push-уведомлений
  /config
    fcm.ts                   — инициализация Firebase Messaging
  App.tsx
```

**Гарды (RootNavigator):**

- нет токена → `AuthNavigator`
- статус `PENDING` → `PendingStack`
- статус `BLOCKED` → `BlockedStack`
- роль WORKER → `WorkerTabs`, ADMIN → `AdminTabs`
- компания `SUSPENDED` → табы доступны, но кнопки прихода/ухода заблокированы (флаг прокидывается из AuthProvider)

---

## 4. СЛОЙ screens

Один экран = один маршрут. Экран тонкий — компонует widgets.

```
/screens
  /auth
    SplashScreen.tsx
    OnboardingScreen.tsx
    RoleSelectScreen.tsx
    RegisterAdminScreen.tsx
    RegisterWorkerScreen.tsx
    PendingScreen.tsx
    LoginScreen.tsx
  /home
    HomeScreen.tsx
  /attendance
    QrScannerScreen.tsx
    ScanResultScreen.tsx
    AttendanceHistoryScreen.tsx
  /office
    OfficeScreen.tsx          — «Сейчас в офисе» (WORKER read / ADMIN edit)
  /schedule
    MyScheduleScreen.tsx
  /requests
    RequestsScreen.tsx        — табы «Новая» / «Мои»
  /news
    NewsFeedScreen.tsx
    NewsDetailScreen.tsx
  /management              — только ADMIN
    ManagementScreen.tsx      — секции: ожидающие, заявки, в офисе
  /subscription            — только ADMIN
    SubscriptionScreen.tsx
    PaymentScreen.tsx
    PaymentSuccessScreen.tsx
  /profile
    ProfileScreen.tsx
  index.ts
```

---

## 5. СЛОЙ widgets

```
/widgets
  /home-header           — приветствие + дата + аватар
  /attendance-card       — график дня + индикаторы прихода/ухода + кнопка CTA
  /employees-today       — три счётчика (в офисе/ушли/нет) → переход в Office
  /schedule-mini         — строка 7 дней с временем начала
  /office-list           — список «сейчас в офисе» (имя + время прихода)
  /schedule-week         — недельный график (карточки дней)
  /history-list          — история посещаемости + сводка + фильтр периода
  /request-form          — форма новой заявки (чипы типов + поля)
  /my-requests-list      — список своих заявок
  /news-feed             — лента новостей
  /pending-employees     — (ADMIN) список ожидающих + accept/reject
  /incoming-requests     — (ADMIN) входящие заявки
  /subscription-status   — (ADMIN) карточка статуса + кнопки
  /payments-history      — (ADMIN) история платежей
  index.ts
```

---

## 6. СЛОЙ features

```
/features
  /auth
    /login
    /register-admin          — создание компании + показ кода
    /register-worker         — регистрация по коду (OTP-поле)
    /logout
    /refresh-token           — model/interceptor
  /attendance
    /check-in                — скан QR → POST → результат
    /check-out
    /manual-checkout         — (ADMIN) указать уход за забывшего
  /request
    /submit-request          — отправка заявки
    /approve-request         — (ADMIN)
    /reject-request          — (ADMIN)
  /employee
    /approve-employee        — (ADMIN) принять PENDING
    /reject-employee         — (ADMIN)
  /news
    /read-news               — отметка прочтения при открытии
    /create-news             — (ADMIN) FAB + форма
  /subscription
    /pay-subscription        — (ADMIN) экран оплаты
    /cancel-subscription     — (ADMIN)
  /profile
    /change-password
    /change-avatar
    /open-web-panel          — (ADMIN) открыть браузер
  /device
    /register-push-token     — регистрация/удаление FCM-токена
  index.ts
```

Пример `features/attendance/check-in`:

```
/ui CheckInButton.tsx
/model useCheckIn.ts        — mutation + парсинг статуса (ON_TIME/LATE/...)
/lib parse-scan-result.ts
/index.ts
```

---

## 7. СЛОЙ entities

```
/entities
  /user
    /model types.ts (UserRole: WORKER|ADMIN, UserStatus), current-user
    /api getProfile, updateProfile
    /ui RoleBadge.tsx, Avatar.tsx
  /company
    /model types.ts (CompanyStatus), isSuspended()
    /api getMyCompany
  /attendance
    /model types.ts (DayStatus, CheckInStatus, CheckOutStatus), formatWorked, statusLabel
    /api checkInRequest, checkOutRequest, getMyHistory, getTodayInOffice
    /ui DayStatusBadge.tsx, AttendanceDayRow.tsx
  /schedule
    /model types.ts (EmployeeSchedule, Weekday)
    /api getMySchedule
    /ui ScheduleDayCard.tsx
  /request
    /model types.ts (RequestType, RequestStatus, AbsenceRequest), typeBehavior()
    /api getMyRequests, getIncomingRequests
    /ui RequestTypeChip.tsx, RequestStatusBadge.tsx, RequestCard.tsx
  /news
    /model types.ts (News)
    /api getNews, getNewsById, markRead
    /ui NewsCard.tsx
  /subscription
    /model types.ts (Subscription, SubStatus)
    /api getMySubscription, getPayments
    /ui SubStatusBadge.tsx
  index.ts
```

> Типы и Zod-схемы — из `/packages/shared`, общие с backend и вебом.
> 

---

## 8. СЛОЙ shared

```
/shared
  /ui                — нативный дизайн-кит (по дизайн-ТЗ)
    Button.tsx, Input.tsx, Card.tsx, Badge.tsx, StatusBadge.tsx,
    BottomSheet.tsx, Toast.tsx, Skeleton.tsx, EmptyState.tsx,
    ErrorState.tsx, OtpInput.tsx (код компании), Avatar.tsx,
    SegmentedControl.tsx (табы периода/заявок)
  /api
    client.ts          — Axios + baseURL /api/v1
    interceptors.ts    — refresh на 401
    query-keys.ts
  /navigation
    types.ts           — типизация маршрутов (RootStackParamList и т.д.)
    hooks.ts           — useTypedNavigation
  /storage
    secure.ts          — Keychain/Keystore (токены)
  /lib
    date.ts, format.ts, network.ts (онлайн/офлайн)
  /config
    theme.ts           — дизайн-токены (цвета, отступы, радиусы, тени)
    env.ts
  /types
    common.ts
  index.ts
```

---

## 9. ПОЛНОЕ ДЕРЕВО (сводка)

```
/src
  /app        providers, navigation(RootNavigator+гарды), config(fcm)
  /screens    auth/ home/ attendance/ office/ schedule/ requests/ news/ management/ subscription/ profile/
  /widgets    attendance-card, employees-today, schedule-mini, office-list, request-form, news-feed, ...
  /features   auth/ attendance/ request/ employee/ news/ subscription/ profile/ device/
  /entities   user company attendance schedule request news subscription
  /shared     ui api navigation storage lib config types
  App.tsx
```

---

## 10. ПРИМЕР ПОТОКА (check-in)

1. `screens/home/HomeScreen` рендерит `widgets/attendance-card`
2. В карточке — кнопка из `features/attendance/check-in`
3. Тап → навигация на `screens/attendance/QrScannerScreen`
4. После скана `features/attendance/check-in/model/useCheckIn` шлёт `entities/attendance/api/checkInRequest`
5. Backend проверяет QR+IP, возвращает статус → парсится в `lib/parse-scan-result`
6. Навигация на `ScanResultScreen` с результатом (ON_TIME/LATE...) → инвалидация query-ключей `attendance`, `today-in-office`
7. `HomeScreen` и `OfficeScreen` обновляются автоматически

---

## 11. НАВИГАЦИЯ И РОЛИ

```
RootNavigator
 ├─ нет токена          → AuthNavigator (Splash→Onboarding→RoleSelect→Register*/Login)
 ├─ PENDING             → PendingStack
 ├─ BLOCKED             → BlockedStack
 ├─ роль WORKER         → WorkerTabs
 │    └─ Главная · Новости · Заявки · Профиль (+ Office по тапу с Главной)
 └─ роль ADMIN          → AdminTabs
      └─ Главная · Новости · Заявки · Профиль(+Управление) (+ Office, Subscription)
```

- Кнопки Приход/Уход — на Главной (не отдельная вкладка)
- `SUSPENDED` компания: табы доступны, но `attendance-card` блокирует кнопки
- Deep links (push) описаны в `app/navigation/linking.ts`

---

## 12. ПРАВИЛА И КОНВЕНЦИИ

- **Публичный API через `index.ts`** каждого слайса
- **Импорт только вниз по слоям**, нет cross-import между слайсами одного слоя
- **Бизнес-логика в `model/`**, экраны и компоненты — только отображение
- **Навигация** не «протекает» в features/entities — те получают колбэки/параметры, а переходы делает screen или widget верхнего уровня (либо через типизированный `useTypedNavigation` из shared)
- **Состояния экранов** (loading/empty/error/success) — через общие компоненты из `shared/ui`
- **Офлайн:** действия с эффектами (check-in, заявка, новость) блокируются без сети (`shared/lib/network`)
- **Tenant-изоляция** — на backend; клиент не доверенная сторона

---

## 13. КАРТА «ТЗ → FSD»

| Раздел ТЗ | Где в FSD |
| --- | --- |
| Splash/Onboarding/RoleSelect/Register/Login | `screens/auth` + `features/auth` + `entities/user,company` |
| Главный экран | `screens/home` + `widgets/home-header, attendance-card, employees-today, schedule-mini` |
| QR check-in/out + результат | `screens/attendance` + `features/attendance/check-in,check-out` + `entities/attendance` |
| «Сейчас в офисе» | `screens/office` + `widgets/office-list` + `features/attendance/manual-checkout` (ADMIN) |
| Расписание (просмотр) | `screens/schedule` + `widgets/schedule-week` + `entities/schedule` |
| История посещаемости | `screens/attendance/AttendanceHistory` + `widgets/history-list` + `entities/attendance` |
| Заявки (подача/мои) | `screens/requests` + `widgets/request-form, my-requests-list` + `features/request/submit-request` + `entities/request` |
| Новости + read-tracking | `screens/news` + `widgets/news-feed` + `features/news/read-news,create-news` + `entities/news` |
| Управление (ADMIN) | `screens/management` + `widgets/pending-employees, incoming-requests, office-list` + `features/employee/*, request/*` |
| Подписка и оплата (ADMIN) | `screens/subscription` + `widgets/subscription-status, payments-history` + `features/subscription/*` + `entities/subscription` |
| Профиль | `screens/profile` + `features/profile/*` + `entities/user,schedule` |
| Push (FCM) | `app/config/fcm` + `app/navigation/linking` + `features/device/register-push-token` |