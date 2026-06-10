# SoftTime — Mobile ↔ Backend Integration Map

> Produced by Block 0 recon. All later blocks read this document instead of guessing.
> Base path: `/api/v1` — all routes below are relative to that prefix.
> Auth: Bearer JWT in `Authorization` header (except `@Public` routes).

---

## 1. Backend Surface — Mobile (WORKER + ADMIN only)

### 1.1 Auth

| Method | Path | Roles | Request body | Response | Tenant? |
|--------|------|-------|--------------|----------|---------|
| POST | `/auth/register/company` | Public | `{ companyName, fullName, email, password }` | `{ accessToken, refreshToken, user }` | Creates company |
| POST | `/auth/register/worker` | Public | `{ fullName, email, password, companyCode }` | `{ accessToken, refreshToken, user }` | Joins via `companyCode` |
| POST | `/auth/login` | Public | `{ email, password }` | `{ accessToken, refreshToken, user }` | Via JWT |
| POST | `/auth/refresh` | Public | `{ refreshToken }` | `{ accessToken, refreshToken }` | Via token |
| POST | `/auth/logout` | Bearer | `{ fcmToken?: string }` | 204 | Via token |

**Login `user` object:**
```
{ id, fullName, email, role: UserRole, status: UserStatus, companyId: string | null }
```

**Brute-force lock:** 5 failed login attempts from same email+IP → 429 for 15 min.

---

### 1.2 Profile

| Method | Path | Roles | Request body | Response | Tenant? |
|--------|------|-------|--------------|----------|---------|
| GET | `/profile` | WORKER, ADMIN | — | `User` (full) | from token |
| PATCH | `/profile` | WORKER, ADMIN | `{ avatarUrl?: string, currentPassword?: string, newPassword?: string }` | `User` | from token |

Password change: requires both `currentPassword` + `newPassword` (min 8, max 72).
Avatar: expects a pre-filled URL string (see §5 — Photo upload).

---

### 1.3 Schedules

| Method | Path | Roles | Request body / Query | Response | Tenant? |
|--------|------|-------|----------------------|----------|---------|
| GET | `/schedules/me` | WORKER, ADMIN | — | `EmployeeSchedule[7]` | from token |
| GET | `/schedules/:userId` | ADMIN | — | `EmployeeSchedule[7]` | from token |
| PUT | `/schedules/:userId` | ADMIN | `{ days: EmployeeSchedule[] }` | `EmployeeSchedule[]` | from token |

Schedule editing is web-only. Mobile reads `/schedules/me` only.
Times are strings in `"HH:mm"` format. `isWorkingDay: false` → rest day.

---

### 1.4 Attendance

| Method | Path | Roles | Request body / Query | Response | Tenant? |
|--------|------|-------|----------------------|----------|---------|
| POST | `/attendance/check-in` | WORKER, ADMIN | `{ qrToken: string }` | `{ record, checkInStatus, diffMinutes, message }` | from token |
| POST | `/attendance/check-out` | WORKER, ADMIN | `{ qrToken: string }` | `{ record, checkOutStatus, dayStatus, workedMinutes, message }` | from token |
| GET | `/attendance/me` | WORKER, ADMIN | `?from=&to=&page=1&limit=30` | `{ data: Attendance[], meta }` | from token |
| GET | `/attendance/today` | ADMIN | — | `Attendance[]` (open, no checkOutAt) | from token |
| GET | `/attendance` | ADMIN | `?from=&to=&userId=&status=&page=1&limit=50` | `{ data: Attendance[], meta }` | from token |
| PATCH | `/attendance/:id` | ADMIN | `{ checkInAt?, checkOutAt?, status?, note? }` | `Attendance` | from token |

---

### 1.5 Requests (absence / early-leave)

| Method | Path | Roles | Request body / Query | Response | Tenant? |
|--------|------|-------|----------------------|----------|---------|
| POST | `/requests` | WORKER, ADMIN | `{ type, startDate, endDate?, desiredTime?, comment? }` | `AbsenceRequest` | from token |
| GET | `/requests/me` | WORKER, ADMIN | `?status=&page=1&limit=20` | `{ data: AbsenceRequest[], meta }` | from token |
| GET | `/requests` | ADMIN | `?status=&userId=&page=1&limit=20` | `{ data: AbsenceRequest[], meta }` | from token |
| PATCH | `/requests/:id/approve` | ADMIN | — | `AbsenceRequest` | from token |
| PATCH | `/requests/:id/reject` | ADMIN | `{ decisionNote?: string }` | `AbsenceRequest` | from token |

**RequestType mapping for mobile UI chips:**

| UI label (Russian) | Backend enum value | On approval |
|--------------------|--------------------|-------------|
| Больничный | `SICK` | Days → `APPROVED_ABSENCE` |
| Семейные обстоятельства | `FAMILY` | Days → `APPROVED_ABSENCE` |
| Отпуск | `VACATION` | Days → `APPROVED_ABSENCE` |
| Командировка | `BUSINESS_TRIP` | Days → `APPROVED_ABSENCE` |
| Удалённая работа | `REMOTE` | Days → `APPROVED_ABSENCE` |
| Опоздание по причине | `LATE_REASON` | History/note only |
| Ранний уход по причине | `EARLY_LEAVE` | Approved early checkout = ON_TIME |
| Другое | `OTHER` | History/note only |

`desiredTime` (format `"HH:mm"`) is only relevant for `EARLY_LEAVE`.

---

### 1.6 News

| Method | Path | Roles | Request body / Query | Response | Tenant? |
|--------|------|-------|----------------------|----------|---------|
| GET | `/news` | WORKER, ADMIN | `?page=1&limit=20` | `{ data: News[], meta }` (DESC by createdAt) | from token |
| GET | `/news/:id` | WORKER, ADMIN | — | `News` | from token |
| POST | `/news/:id/read` | WORKER, ADMIN | — | 200 OK | from token |
| POST | `/news` | ADMIN | `{ title, body, photoUrl?: string }` | `News` | from token |
| GET | `/news/:id/reads` | ADMIN | — | `{ read: User[], unread: User[] }` | from token |

`GET /news/:id` **auto-marks as read** server-side. The explicit `POST /news/:id/read` is the safer explicit call.
The feed does NOT include `isRead` per item — the read state must be tracked from `NewsRead` records or by inspecting the response. See §7 Gap table.

---

### 1.7 Management — Employees (ADMIN)

| Method | Path | Roles | Request body / Query | Response | Tenant? |
|--------|------|-------|----------------------|----------|---------|
| GET | `/users` | ADMIN | `?status=PENDING&search=&page=1&limit=20` | `{ data: User[], meta }` | from token |
| GET | `/users/:id` | ADMIN | — | `User` + history | from token |
| PATCH | `/users/:id/approve` | ADMIN | — | `User` (ACTIVE) | from token |
| PATCH | `/users/:id/reject` | ADMIN | — | 204 | from token |
| PATCH | `/users/:id/status` | ADMIN | `{ status: 'ACTIVE'|'BLOCKED'|'WARNING' }` | `User` | from token |

Pending employees: `GET /users?status=PENDING`.

---

### 1.8 Subscription & Payment (ADMIN)

| Method | Path | Roles | Request body / Query | Response | Tenant? |
|--------|------|-------|----------------------|----------|---------|
| GET | `/companies/me` | ADMIN | — | `Company + companyCode + subscription` | from token |
| GET | `/subscriptions/me` | ADMIN | — | `Subscription + daysRemaining` | from token |
| POST | `/subscriptions/pay` | ADMIN | — | `{ paymentUrl?, ... }` | from token |
| POST | `/subscriptions/cancel` | ADMIN | — | 200 OK | from token |
| GET | `/payments` | ADMIN | `?page=1&limit=20` | `{ data: Payment[], meta }` | from token |

Payment provider is TBD/test-mode. `POST /subscriptions/pay` returns a redirect URL or token for the provider. Do NOT hardcode a provider SDK.

---

### 1.9 Devices / FCM

| Method | Path | Roles | Request body | Response | Tenant? |
|--------|------|-------|--------------|----------|---------|
| POST | `/devices` | Bearer | `{ fcmToken: string, platform: 'ios'|'android' }` | `DeviceToken` | from token |
| DELETE | `/devices/:token` | Bearer | — | 200 OK | from token |

`:token` in the DELETE path is the literal FCM token string (not a UUID).

---

### 1.10 QR token (ADMIN reads it to display the QR code on web)

> Mobile never calls `/qr` directly — it only **scans** the QR token. The backend's `companyCode` on the QR is the value that goes into the check-in/out request as `qrToken`.

---

## 2. Auth Mechanics for Native

### 2.1 Token shapes

**Access token** (JWT, 15 min):
```
{
  sub: userId (string),
  role: UserRole,
  companyId: string | null,
  status: UserStatus,      ← user status in payload
  iat, exp
}
```

**Refresh token** (JWT, 30 days, backed by Redis):
```
{ sub: userId, tokenId: UUID, type: 'refresh', iat, exp }
```
Redis key: `refresh:{userId}:{tokenId}` = `'1'`, TTL 30 days.

### 2.2 Login response
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "fullName": "...",
    "email": "...",
    "role": "ADMIN" | "WORKER",
    "status": "PENDING" | "ACTIVE" | "WARNING" | "BLOCKED",
    "companyId": "..."
  }
}
```

**Company status** is NOT in the login response. It must be fetched via `GET /companies/me` (ADMIN) or derived from context. For WORKER, company status affects check-in but is not directly exposed — it surfaces as a 403 from `CompanyActiveGuard`. Recommended: ADMIN calls `GET /companies/me` after login; WORKER detects SUSPENDED from 403 errors.

### 2.3 Refresh flow
```
POST /auth/refresh
{ "refreshToken": "<current refresh token>" }
→ { "accessToken": "...", "refreshToken": "..." }
```
Old refresh token is invalidated in Redis on use.

### 2.4 Logout
```
POST /auth/logout
{ "fcmToken": "..." }   ← include to also delete device token
→ 204
```
Invalidates ALL refresh tokens for the user in Redis.

### 2.5 Status routing
After login, check `user.status`:
- `PENDING` → Waiting screen ("Заявка на рассмотрении")
- `BLOCKED` → Blocked screen
- `ACTIVE` / `WARNING` → Normal app (role-based tab navigator)
- `DELETED` → Should not be able to log in (backend returns 401/403)

After check-in/out, if `CompanyActiveGuard` returns 403, treat as `SUSPENDED`.

---

## 3. Check-in / Check-out Contract (CRITICAL)

### 3.1 What the app sends

```
POST /attendance/check-in
POST /attendance/check-out

Body: { "qrToken": "<string from QR code>" }
```

The QR code encodes a single string — the `token` field from the `QrToken` table. The app extracts this string from the scanned QR and sends it verbatim. **Nothing else is sent — no IP, no location.**

### 3.2 How the backend verifies

**Step 1 — QR token validation:**
- Looks up `QrToken` where `token = body.qrToken` AND `isActive = true` AND `companyId = tokenCompanyId from JWT`.
- If not found → 400 `"QR недействителен"`

**Step 2 — IP verification:**
- Backend extracts the client IP using `extractIp(req)`:
  1. `req.headers['x-forwarded-for']` → split by `,` → take first → trim
  2. Fallback: `req.ip`
  3. Ultimate fallback: `'0.0.0.0'`
- Loads all `OfficeNetwork` records for the company (`cidr` field).
- For each network: if `cidr` contains `/` → CIDR mask match; else → exact string match.
- If no network matches → 400 `"Вне офисной сети"`

### 3.3 NGINX / proxy requirement (RISK FLAG)

The IP check relies entirely on the real client IP being forwarded by nginx via `X-Forwarded-For`. If nginx is not configured with `proxy_set_header X-Forwarded-For $remote_addr` (or `$proxy_add_x_forwarded_for`), the backend will receive the proxy IP instead of the mobile device's IP, and **all check-ins will fail with "Вне офисной сети"** unless the proxy IP is added to office networks.

**Action required on the infrastructure side before Block 5 can be fully tested:**
```nginx
location /api {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://backend:3000;
}
```

The mobile app does NOT need to send IP — this is a backend/nginx task.

### 3.4 Check-in success response

```json
{
  "record": { /* Attendance object */ },
  "checkInStatus": "ON_TIME" | "LATE" | "EARLY_ARRIVAL",
  "diffMinutes": -5,          // negative = early, positive = late
  "message": "Вовремя"        // "Опоздал на X мин" | "Пришёл на X мин раньше"
}
```

Tolerance: ±5 minutes around the scheduled `startTime`.

### 3.5 Check-out success response

```json
{
  "record": { /* Attendance object */ },
  "checkOutStatus": "ON_TIME" | "LEFT_EARLY" | "OVERTIME",
  "dayStatus": "PRESENT" | "LATE" | "EARLY_LEAVE" | "OVERTIME",
  "workedMinutes": 480,        // integer, total minutes worked
  "message": "Уход отмечен"
}
```

`LEFT_EARLY` is overridden to `ON_TIME` by the backend if an `EARLY_LEAVE` request for today is `APPROVED`. App just renders what the backend returns.

### 3.6 Error codes for check-in/out

| HTTP | Message from backend | Mobile display |
|------|----------------------|----------------|
| 400 | `"QR недействителен"` | "QR-код недействителен или устарел" |
| 400 | `"Вне офисной сети"` | "Вы находитесь вне офисной сети" |
| 400 | `"Сегодня нерабочий день"` | "Сегодня нерабочий день по вашему графику" |
| 409 | `"Приход уже отмечен"` | "Приход уже был отмечен сегодня" |
| 409 | `"Нет активного прихода для выхода"` | "Сначала отметьте приход" |
| 403 | (CompanyActiveGuard) | "Подписка компании приостановлена" |
| network error | — | "Нет подключения к интернету" |

---

## 4. FCM Contract

### 4.1 Register device token
```
POST /devices
{ "fcmToken": "<Firebase token>", "platform": "ios" | "android" }
```
Call after successful login (both fresh login and silent refresh if not yet registered).

### 4.2 Delete device token
```
DELETE /devices/<fcmToken>
```
Call on logout (the FCM token string is the URL param, not a UUID).

### 4.3 Push events (backend sends these)

| Event | Recipient | When | Deep-link target |
|-------|-----------|------|------------------|
| Новый сотрудник ждёт подтверждения | ADMIN | Worker registers | Management → pending list |
| Регистрация одобрена | WORKER | Admin approves | Home |
| Регистрация отклонена | WORKER | Admin rejects | Login/Onboarding |
| Заявка подана (новая) | ADMIN | Worker submits request | Management → requests |
| Заявка одобрена | Requester | Admin approves | My Requests → detail |
| Заявка отклонена | Requester | Admin rejects | My Requests → detail |
| Новость опубликована | All ACTIVE in company | Admin creates news | News detail |
| Не закрыл смену (авто) | ADMIN | Cron 15–30 min | Management → office |
| Подписка истекает / не оплачена | ADMIN | Cron daily | Subscription |
| Компания приостановлена | ADMIN | Status → SUSPENDED | Subscription |

---

## 5. Photo Upload Contract

**Both news photo and profile avatar use pre-filled URL strings — no multipart upload in the mobile-facing controllers.**

### 5.1 Profile avatar
```
PATCH /profile
{ "avatarUrl": "https://..." }
```
The mobile app must upload the image to a storage service first (S3, Cloudinary, etc.) and obtain a URL, then PATCH with that URL. The backend does no file handling. **GAP: No file upload endpoint is exposed by the backend. Block 12 must either use a presigned URL flow with the storage provider directly, or this needs a backend upload endpoint. Flag for review.**

### 5.2 News photo
```
POST /news
{ "title": "...", "body": "...", "photoUrl": "https://..." }
```
Same pattern — pre-filled URL. Same gap applies. **Flag for Block 9.**

---

## 6. Mobile Mock Inventory

All mock data to replace, grouped by feature:

| Feature | File | Mock exports |
|---------|------|--------------|
| User/Auth | `mobile/src/entities/user/api/mock.ts` | `mockWorker`, `mockAdmin`, `mockWorkers` |
| Attendance | `mobile/src/entities/attendance/api/mock.ts` | `mockTodayAttendance`, `mockAttendanceHistory`, `mockTodayInOffice` |
| Schedule | `mobile/src/entities/schedule/api/mock.ts` | `mockSchedule` |
| Requests | `mobile/src/entities/request/api/mock.ts` | `mockMyRequests`, `mockIncomingRequests` |
| Subscription | `mobile/src/entities/subscription/api/mock.ts` | `mockSubscription`, `mockPayments` |
| News | `mobile/src/entities/news/api/mock.ts` | `mockNews`, `NewsWithRead` type, `currentMockNews`, `addMockNews()` |
| Auth hooks | `mobile/src/features/auth/login/model/useLogin.ts` | Login logic (likely uses mock user) |
| Auth hooks | `mobile/src/features/auth/register-admin/model/useRegisterAdmin.ts` | Registration logic |
| Auth hooks | `mobile/src/features/auth/register-worker/model/useRegisterWorker.ts` | Registration logic |
| Check-in hook | `mobile/src/features/attendance/check-in/model/useCheckIn.ts` | Check-in mutation |
| Config | `mobile/src/app/config/fcm.ts` | FCM setup (may be stub) |

**Local type defined in mock (not from shared):**
- `OfficeEntry` in `mobile/src/entities/attendance/api/mock.ts` — used for "now in office" data. Replace with real backend shape from `GET /attendance/today`.

---

## 7. Config — Base URL & Environment

### Current setup
- File: `mobile/src/shared/config/env.ts`
- Variable: `EXPO_PUBLIC_API_URL`
- Default: `http://localhost:3000` ← **BREAKS on physical device**
- Resolves to: `${apiBaseUrl}/api/v1` in the Axios client

### How to configure for dev on a physical device
Create `.env.local` (or `.env`) in the `mobile/` directory:
```
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000
```
Where `192.168.X.X` is the LAN IP of the dev machine running the backend.
Use `ipconfig` (Windows) / `ifconfig` (Mac/Linux) to find it.
Alternatively, use `ngrok` or `expo-tunnel` for tunnelling.

For production, set `EXPO_PUBLIC_API_URL` to the deployed backend URL via CI/CD secrets or an `.env.production` file.

---

## 8. Gap Table

| Screen | Backend endpoint exists? | Screen exists in mobile? | Uses mock now? | Shared types exist? | Notes |
|--------|--------------------------|--------------------------|----------------|---------------------|-------|
| Onboarding | N/A | Yes | — | — | Static screens, no API |
| ADMIN register / create company | ✅ `POST /auth/register/company` | Yes | Yes | ✅ `registerCompanySchema` | Returns `companyCode` in `user` or separate? Verify response. |
| WORKER register | ✅ `POST /auth/register/worker` | Yes | Yes | ✅ `registerWorkerSchema` | Status = PENDING after register |
| Login | ✅ `POST /auth/login` | Yes | Yes | ✅ `loginSchema` | Brute-force: 429 error code needed |
| Waiting screen (PENDING) | N/A | ? | — | — | Check if screen exists in mobile nav |
| Blocked screen | N/A | ? | — | — | Check if screen exists |
| Home | ✅ `/schedules/me` + `/attendance/me` (today filter) | Yes | Yes | ✅ | "Employees today" = `GET /attendance/today` (ADMIN sees count; WORKER may not have it) |
| QR Scanner + Check-in | ✅ `POST /attendance/check-in` | Yes | Yes | ✅ `CheckInStatus` | See §3; nginx proxy config required |
| QR Scanner + Check-out | ✅ `POST /attendance/check-out` | Yes | Yes | ✅ `CheckOutStatus` | Same; `workedMinutes` in response |
| Now In Office (WORKER) | ✅ `GET /attendance/today` | Yes | Yes | ✅ | ADMIN-only endpoint — need to verify WORKER access or a separate endpoint |
| Now In Office (ADMIN manual checkout) | ✅ `PATCH /attendance/:id` | Yes | Yes | ✅ | Sets `isManual = true` |
| My Schedule | ✅ `GET /schedules/me` | Yes | Yes | ✅ `EmployeeSchedule` | Read-only on mobile |
| Attendance History | ✅ `GET /attendance/me` | Yes | Yes | ✅ `Attendance`, `DayStatus` | Date range filter supported |
| New Request | ✅ `POST /requests` | Yes | Yes | ✅ `absenceRequestSchema` | `desiredTime` for EARLY_LEAVE |
| My Requests | ✅ `GET /requests/me` | Yes | Yes | ✅ `AbsenceRequest` | — |
| News Feed | ✅ `GET /news` | Yes | Yes | ✅ `News` | Feed response does NOT include `isRead` field per item — **GAP** |
| News Detail | ✅ `GET /news/:id` | Yes | Yes | ✅ | Auto-marks read on GET; also `POST /news/:id/read` |
| News Create (ADMIN) | ✅ `POST /news` | Yes | Yes | ✅ | Photo = pre-filled URL; no upload endpoint exists — **GAP** |
| Pending Employees (ADMIN) | ✅ `GET /users?status=PENDING` + `/approve` + `/reject` | Yes | Yes | ✅ `UserStatus` | — |
| Employee Requests (ADMIN) | ✅ `GET /requests` + `/approve` + `/reject` | Yes | Yes | ✅ | — |
| Subscription Status (ADMIN) | ✅ `GET /subscriptions/me` | Yes | Yes | ✅ `Subscription`, `SubStatus` | Company status from `GET /companies/me` |
| Payment (ADMIN) | ✅ `POST /subscriptions/pay` | Yes | Yes | ✅ | Provider TBD; returns paymentUrl |
| Payment History (ADMIN) | ✅ `GET /payments` | Yes | Yes | ✅ `Payment` | — |
| Profile | ✅ `GET /profile` | Yes | Yes | ✅ `User` | — |
| Change Password | ✅ `PATCH /profile` | Yes | Yes | — | Needs current + new password |
| Change Avatar | ✅ `PATCH /profile` (avatarUrl) | Yes | Yes | — | No upload endpoint — **GAP** (pre-filled URL only) |
| FCM registration | ✅ `POST /devices` | Partial (fcm.ts stub) | Partial | — | Platform field required |
| FCM logout delete | ✅ `DELETE /devices/:token` | ? | ? | — | Needs to run at logout |

---

## 9. Missing Shared Types / Schemas to Add in Block 1

The following are needed by mobile but not yet present in `packages/shared`:

1. **`CheckInRequest`** schema — `{ qrToken: z.string().min(1) }`
2. **`CheckInResult`** type — `{ record: Attendance, checkInStatus: CheckInStatus, diffMinutes: number, message: string }`
3. **`CheckOutResult`** type — `{ record: Attendance, checkOutStatus: CheckOutStatus, dayStatus: DayStatus, workedMinutes: number, message: string }`
4. **`RegisterDeviceDto`** schema — `{ fcmToken: z.string().min(1), platform: z.enum(['ios', 'android']) }`
5. **`AuthResponse`** type — `{ accessToken: string, refreshToken: string, user: Pick<User, 'id'|'fullName'|'email'|'role'|'status'|'companyId'> }`
6. **`NewsWithIsRead`** type — `News & { isRead: boolean }` — **BUT the backend feed does NOT return `isRead`**. Mobile must determine read status by cross-referencing with `GET /news/:id` reads data. This is a backend gap (feed should include `isRead` per item).

---

## 10. Critical Risk Points (summary)

1. **NGINX proxy / X-Forwarded-For (BLOCK 5 BLOCKER):** The check-in/out IP verification depends entirely on nginx forwarding the real client IP. Without correct nginx config (`proxy_set_header X-Forwarded-For`), every check-in will return "Вне офисной сети". This must be fixed on the infrastructure side before check-in can be tested end-to-end on a device behind a reverse proxy.

2. **Company status not in JWT:** The JWT access token contains `user.status` but NOT `company.status`. After login, ADMIN must call `GET /companies/me` to get `companyStatus`. WORKER discovers SUSPENDED only via 403 from `CompanyActiveGuard`. Block 3 must handle this asymmetry.

3. **News feed `isRead` gap:** `GET /news` returns `News[]` without an `isRead` field. The unread/read distinction shown in the mobile feed requires either: (a) a backend change to add `isRead` to the feed response (recommended), or (b) client-side tracking of read news IDs, which is fragile. Flag for backend before Block 9.

4. **Photo upload — no multipart endpoint:** Both news photo and profile avatar controllers expect a pre-filled `photoUrl` string. There is no backend file upload endpoint. Mobile needs an external storage flow (S3 presigned URL) to upload images first. This must be clarified/implemented before Blocks 9 and 12.

5. **`GET /attendance/today` is ADMIN-only:** The "Now in office" screen exists for both WORKERs and ADMINs in the spec, but the `/attendance/today` endpoint requires `@Roles('ADMIN')`. WORKER cannot call it. Either a separate public-ish endpoint is needed for WORKERs to see who's in office, or the mobile spec needs revisiting. Flag for backend before Block 6.

6. **Base URL on physical device:** The default `http://localhost:3000` breaks on any physical device. Dev workflow requires setting `EXPO_PUBLIC_API_URL` to the LAN IP (or using ngrok). Document and enforce in Block 2.

7. **`companyCode` in register-company response:** The spec shows the success screen displaying the 6-char company code. Confirm the backend returns it in the `POST /auth/register/company` response (via `user.company.companyCode` or a top-level field). Block 3 depends on this.

8. **`WORKER registration → status = PENDING`:** After `POST /auth/register/worker` the user is PENDING. The response contains tokens but the status is PENDING. Block 3 must NOT route a PENDING user to the Home screen — it must show the waiting screen and avoid calling any feature endpoints.

9. **Refresh token rotation:** Each use of `POST /auth/refresh` invalidates the old refresh token and issues a new pair. The mobile token store must always overwrite both tokens after a successful refresh. Failure to do so causes every second silent refresh to fail with 401, logging the user out unexpectedly.

10. **FCM token in logout body:** `POST /auth/logout` accepts an optional `fcmToken` in the body. Block 3 calls logout but defers FCM delete to Block 13. Until Block 13 runs, logout will leave stale device tokens in the DB. This is acceptable for development but must be completed before release.
