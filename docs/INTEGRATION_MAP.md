# SoftTime — Integration Map

> Generated: 2026-06-09. Read-only recon of backend controllers, service return shapes, and web API layer.  
> Base URL prefix for all backend routes: `/api/v1`

---

## 1. Backend Surface

### Feature: Auth

All auth routes are `@Public` (no JWT required) except `POST /auth/logout`.

#### `POST /api/v1/auth/register/company`
- **Role guard:** public
- **Request body:**
  ```ts
  { companyName: string; fullName: string; email: string; password: string } // min 8, max 72
  ```
- **Response:**
  ```ts
  { accessToken: string; refreshToken: string; user: { id, fullName, email, role: "ADMIN", status, companyId } }
  ```
- **Tenant-scoped?** No (creates the tenant)
- **Side-effects:** Creates Company (status TRIAL), User (role ADMIN, status ACTIVE), Subscription (status TRIAL, 30-day), WorkSettings; sends push to PROVIDER users.

#### `POST /api/v1/auth/register/worker`
- **Role guard:** public
- **Request body:**
  ```ts
  { fullName: string; email: string; password: string; companyCode: string } // companyCode exactly 6 chars
  ```
- **Response:** `{ accessToken, refreshToken, user: { id, fullName, email, role: "WORKER", status: "PENDING", companyId } }`
- **Tenant-scoped?** No (looks up company by companyCode)
- **Side-effects:** Sends push to company admins.

#### `POST /api/v1/auth/login`
- **Role guard:** public
- **Request body:** `{ email: string; password: string }`
- **Response:** `{ accessToken, refreshToken, user: { id, fullName, email, role, status, companyId } }`
- **Notes:** Brute-force protection via Redis key `bf:<email>:<ip>` (max 5 attempts, block 15 min). Both tokens returned in JSON body (not cookies).

#### `POST /api/v1/auth/refresh`
- **Role guard:** public
- **Request body:** `{ refreshToken: string }`
- **Response:** `{ accessToken, refreshToken }` — new pair only (no `user` object)
- **Notes:** Refresh token stored in Redis as `refresh:<userId>:<tokenId>` = `"1"`, TTL 30 days. Old token is deleted; rotation is enforced.

#### `POST /api/v1/auth/logout`
- **Role guard:** any authenticated user (JWT required)
- **Request body:** `{ fcmToken?: string }`
- **Response:** `204 No Content`
- **Notes:** Deletes all `refresh:<userId>:*` keys from Redis; optionally deletes the FCM token record.

---

### Feature: Companies

#### `GET /api/v1/companies/me`
- **Role guard:** ADMIN
- **Query params:** none
- **Response:**
  ```ts
  {
    id, name, companyCode, status: CompanyStatus, createdAt,
    subscription: { status: SubStatus, priceUsd, periodStart, periodEnd, nextBillingAt } | null
  }
  ```
- **Tenant-scoped?** Yes — reads from JWT `companyId`

---

### Feature: Subscriptions & Payments

#### `GET /api/v1/subscriptions/me`
- **Role guard:** ADMIN
- **Response:** Full Prisma `Subscription` row + computed `daysLeft: number`
  ```ts
  { id, companyId, status: SubStatus, priceUsd, periodStart, periodEnd, nextBillingAt, daysLeft }
  ```
- **Tenant-scoped?** Yes

#### `POST /api/v1/subscriptions/pay`
- **Role guard:** ADMIN
- **Request body:** none
- **Response:** `{ checkoutUrl: string }` — redirect URL from payment provider
- **Tenant-scoped?** Yes

#### `POST /api/v1/subscriptions/cancel`
- **Role guard:** ADMIN
- **Request body:** none
- **Response:** Updated `Subscription` row (status = CANCELLED); also sets Company status to SUSPENDED
- **Tenant-scoped?** Yes

#### `GET /api/v1/payments`
- **Role guard:** ADMIN
- **Query params:** `page?: number` (default 1), `limit?: number` (default 20, max 100)
- **Response:**
  ```ts
  { data: Payment[], meta: { total, page, limit, pages } }
  ```
  Payment fields: `{ id, companyId, subscriptionId, amountUsd, periodStart, periodEnd, status: PaymentStatus, provider, providerRef, createdAt }`
- **Tenant-scoped?** Yes

#### `POST /api/v1/webhooks/payments`
- **Role guard:** public (signature check via `x-webhook-signature` header)
- **Request body:** `{ companyId: string; status: "success"|"failed"; providerRef?: string; amount?: number }`
- **Response:** `{ ok: boolean; reason?: string }`
- **Tenant-scoped?** No (cross-tenant webhook)

---

### Feature: Users / Employees

#### `GET /api/v1/users`
- **Role guard:** ADMIN
- **Query params:** `status?: UserStatus`, `search?: string`, `page?: number` (default 1), `limit?: number` (default 20, max 100)
- **Response:**
  ```ts
  { data: User[], meta: { total, page, limit, pages } }
  ```
  User fields (no passwordHash): `{ id, fullName, email, role, status, avatarUrl, hiredAt, adminNote, createdAt, companyId }`
- **Tenant-scoped?** Yes (Prisma extension scopes by company_id automatically)

#### `GET /api/v1/users/:id`
- **Role guard:** ADMIN
- **Response:**
  ```ts
  { user: User, attendance: Attendance[], requests: AbsenceRequest[] }
  ```
  Returns last 50 attendance records and all requests for the user.
- **Tenant-scoped?** Yes

#### `PATCH /api/v1/users/:id/approve`
- **Role guard:** ADMIN
- **Request body:** none
- **Response:** Updated User (status PENDING → ACTIVE)
- **Tenant-scoped?** Yes
- **Side-effects:** Audit log `USER_APPROVED`; push to worker.

#### `PATCH /api/v1/users/:id/reject`
- **Role guard:** ADMIN
- **Request body:** none
- **Response:** `204 No Content`
- **Tenant-scoped?** Yes
- **Side-effects:** Soft-deletes user (status DELETED, deletedAt set); audit log `USER_REJECTED`; push to worker.

#### `PATCH /api/v1/users/:id/status`
- **Role guard:** ADMIN
- **Request body:** `{ status: "ACTIVE" | "BLOCKED" | "WARNING" }`
- **Response:** Updated User
- **Tenant-scoped?** Yes
- **Side-effects:** Audit log `USER_STATUS_CHANGED`.

#### `PATCH /api/v1/users/:id/note`
- **Role guard:** ADMIN
- **Request body:** `{ note: string }` (max 1000 chars)
- **Response:** Updated User
- **Tenant-scoped?** Yes
- **Side-effects:** Audit log `USER_NOTE_UPDATED`.

#### `DELETE /api/v1/users/:id`
- **Role guard:** ADMIN
- **Response:** `204 No Content`
- **Tenant-scoped?** Yes
- **Notes:** Soft delete (status DELETED, deletedAt set). Cannot delete own account.

#### `GET /api/v1/profile`
- **Role guard:** ADMIN or WORKER (any authenticated)
- **Response:** User object (same fields as USER_SELECT, no passwordHash)
- **Tenant-scoped?** Yes — reads own profile from JWT userId

#### `PATCH /api/v1/profile`
- **Role guard:** ADMIN or WORKER
- **Request body:**
  ```ts
  { avatarUrl?: string | null; currentPassword?: string; newPassword?: string }
  ```
  `newPassword` requires `currentPassword`; password min 8, max 72 chars.
- **Response:** Updated User
- **Tenant-scoped?** Yes

---

### Feature: Attendance

#### `POST /api/v1/attendance/check-in`
- **Role guard:** WORKER or ADMIN (any authenticated); also requires `CompanyActiveGuard`
- **Request body:** `{ qrToken: string }`
- **Response:**
  ```ts
  { record: AttendanceRecord, checkInStatus: CheckInStatus, diffMinutes: number, message: string }
  ```
- **Tenant-scoped?** Yes
- **Validation:** QR must be active and scoped to company; IP must be in an office network CIDR.

#### `POST /api/v1/attendance/check-out`
- **Role guard:** WORKER or ADMIN; `CompanyActiveGuard`
- **Request body:** `{ qrToken: string }`
- **Response:**
  ```ts
  { record: AttendanceRecord, checkOutStatus: CheckOutStatus, dayStatus: DayStatus, workedMinutes: number, message: string }
  ```
- **Tenant-scoped?** Yes

#### `GET /api/v1/attendance/me`
- **Role guard:** WORKER or ADMIN (any authenticated)
- **Query params:** `from?: string (YYYY-MM-DD)`, `to?: string`, `page?: number` (default 1), `limit?: number` (default 30, max 100)
- **Response:** `{ data: AttendanceRecord[], meta: { total, page, limit, pages } }`
- **Tenant-scoped?** Yes (own records only)

#### `POST /api/v1/attendance/manual`
- **Role guard:** ADMIN
- **Request body:**
  ```ts
  { userId: string (uuid); date: string (YYYY-MM-DD); status: DayStatus; checkInAt?: string (ISO datetime) | null; checkOutAt?: string | null; note?: string (max 500) }
  ```
- **Response:** Created AttendanceRecord
- **Tenant-scoped?** Yes
- **Side-effects:** Audit log `ATTENDANCE_MANUAL_CREATE`. Fails if record for that date already exists.

#### `GET /api/v1/attendance/today`
- **Role guard:** ADMIN
- **Response:** `AttendanceRecord[]` — records where checkInAt != null and checkOutAt == null for today UTC midnight
- **Tenant-scoped?** Yes

#### `GET /api/v1/attendance`
- **Role guard:** ADMIN
- **Query params:** `from?: string`, `to?: string`, `userId?: string (uuid)`, `status?: DayStatus`, `page?: number` (default 1), `limit?: number` (default 50, max 100)
- **Response:** `{ data: AttendanceRecord[], meta: { total, page, limit, pages } }`
- **Tenant-scoped?** Yes

#### `PATCH /api/v1/attendance/:id`
- **Role guard:** ADMIN
- **Request body:** at least one of: `{ checkInAt?: string (ISO datetime) | null; checkOutAt?: string | null; status?: DayStatus; note?: string (max 500) }`
- **Response:** Updated AttendanceRecord
- **Tenant-scoped?** Yes
- **Side-effects:** Sets `isManual = true`; recalculates `workedMinutes`; audit log `ATTENDANCE_MANUAL_EDIT`.

---

### Feature: Schedules

#### `GET /api/v1/schedules/me`
- **Role guard:** WORKER or ADMIN (any authenticated)
- **Response:** `EmployeeSchedule[]` — array of 7 day-schedule records for the caller
- **Tenant-scoped?** Yes

#### `GET /api/v1/schedules/:userId`
- **Role guard:** ADMIN
- **Response:** `EmployeeSchedule[]` — 7 day-schedule records for the given user
- **Tenant-scoped?** Yes

#### `PUT /api/v1/schedules/:userId`
- **Role guard:** ADMIN
- **Request body:**
  ```ts
  { days: ScheduleDay[] } // exactly 7 items
  ```
  Each ScheduleDay: `{ weekday: Weekday; isWorkingDay: boolean; startTime: string|null ("HH:mm"); endTime: string|null; autoCheckoutBuffer: number (default 60) }`.  
  Business rule: working days must have duration ≥ 6 hours; returns 422 otherwise.
- **Response:** Saved schedule records
- **Tenant-scoped?** Yes
- **Side-effects:** Audit log.

#### `POST /api/v1/schedules/apply-all`
- **Role guard:** ADMIN
- **Request body:**
  ```ts
  { days: ScheduleDay[]; userIds?: string[] } // if userIds omitted → applies to all employees
  ```
- **Response:** Updated schedule records
- **Tenant-scoped?** Yes

---

### Feature: Requests (Absence / Early Leave)

#### `POST /api/v1/requests`
- **Role guard:** WORKER or ADMIN (any authenticated)
- **Request body:**
  ```ts
  { type: RequestType; startDate: Date (coerced); endDate?: Date | null; desiredTime?: string ("HH:mm") | null; comment?: string | null }
  ```
- **Response:** Created AbsenceRequest
- **Tenant-scoped?** Yes
- **Side-effects:** Push to company admins.

#### `GET /api/v1/requests/me`
- **Role guard:** WORKER or ADMIN
- **Query params:** `status?: RequestStatus`, `page?: number` (default 1), `limit?: number` (default 20, max 100)
- **Response:** `{ data: AbsenceRequest[], meta: { total, page, limit, pages } }`
- **Tenant-scoped?** Yes (own requests only)

#### `GET /api/v1/requests`
- **Role guard:** ADMIN
- **Query params:** `status?: RequestStatus`, `userId?: string (uuid)`, `page?: number` (default 1), `limit?: number` (default 20, max 100)
- **Response:** `{ data: AbsenceRequest[], meta: { total, page, limit, pages } }`
- **Tenant-scoped?** Yes

#### `PATCH /api/v1/requests/:id/approve`
- **Role guard:** ADMIN
- **Request body:** none
- **Response:** Updated AbsenceRequest (status APPROVED)
- **Tenant-scoped?** Yes
- **Side-effects:** For SICK/FAMILY/VACATION/BUSINESS_TRIP/REMOTE — sets attendance days in range to APPROVED_ABSENCE. For EARLY_LEAVE — marks relevant attendance day.

#### `PATCH /api/v1/requests/:id/reject`
- **Role guard:** ADMIN
- **Request body:** `{ decisionNote?: string (max 500) }`
- **Response:** `200 OK` with updated AbsenceRequest (status REJECTED)
- **Tenant-scoped?** Yes

---

### Feature: News

#### `GET /api/v1/news`
- **Role guard:** WORKER or ADMIN (any authenticated)
- **Query params:** `page?: number` (default 1), `limit?: number` (default 20, max 100)
- **Response:** `{ data: News[], meta: { total, page, limit, pages } }` — ordered desc by createdAt
- **Tenant-scoped?** Yes

#### `POST /api/v1/news`
- **Role guard:** ADMIN
- **Request body:** `{ title: string (min 1, max 255); body: string (min 1); photoUrl?: string (url) | null }`
- **Response:** Created News record
- **Tenant-scoped?** Yes
- **Side-effects:** Push to all ACTIVE employees.

#### `GET /api/v1/news/:id/reads`
- **Role guard:** ADMIN
- **Response:** Read stats (who read / who hasn't)
- **Tenant-scoped?** Yes

#### `GET /api/v1/news/:id`
- **Role guard:** WORKER or ADMIN
- **Response:** News record (auto-marks as read by current user)
- **Tenant-scoped?** Yes

#### `POST /api/v1/news/:id/read`
- **Role guard:** WORKER or ADMIN
- **Request body:** none
- **Response:** `200 OK`
- **Tenant-scoped?** Yes

---

### Feature: Office Networks

All endpoints require ADMIN role.

#### `GET /api/v1/office-networks`
- **Response:** `OfficeNetwork[]`
- **Tenant-scoped?** Yes

#### `POST /api/v1/office-networks`
- **Request body:** `{ label: string (min 1, max 100); cidr: string }` (CIDR pattern: `\d{1..3}.\d{1..3}.\d{1..3}.\d{1..3}(/\d{1..2})?`)
- **Response:** Created OfficeNetwork
- **Side-effects:** Audit log.

#### `PATCH /api/v1/office-networks/:id`
- **Request body:** at least one of: `{ label?: string; cidr?: string }`
- **Response:** Updated OfficeNetwork
- **Side-effects:** Audit log.

#### `DELETE /api/v1/office-networks/:id`
- **Response:** `200 OK` with deleted record (physical delete, no soft-delete)
- **Side-effects:** Audit log.

---

### Feature: QR

All endpoints require ADMIN role.

#### `GET /api/v1/qr`
- **Response:** Active QrToken for the company
  ```ts
  { id, companyId, officeNetworkId: string|null, token: string, isActive: boolean, createdAt }
  ```
- **Tenant-scoped?** Yes

#### `POST /api/v1/qr/regenerate`
- **Request body:** `{ officeNetworkId?: string (uuid) | null }`
- **Response:** `200 OK` with new QrToken
- **Tenant-scoped?** Yes
- **Side-effects:** Deactivates old QR; audit log `QR_REGENERATED`.

---

### Feature: Reports

All endpoints require ADMIN role.

#### `GET /api/v1/reports/attendance`
- **Query params:** `from: string` (required, coerced to Date), `to: string` (required), `userId?: string (uuid)`
- **Response:** Attendance report rows (aggregated per employee)
- **Tenant-scoped?** Yes

#### `GET /api/v1/reports/attendance/export`
- **Query params:** same as above
- **Response:** `text/csv` file download with `Content-Disposition: attachment; filename="attendance-<from>_<to>.csv"`
- **Tenant-scoped?** Yes

---

### Feature: Audit Logs

#### `GET /api/v1/audit-logs`
- **Role guard:** ADMIN
- **Query params:** `from?: Date (coerced)`, `to?: Date`, `action?: string`, `page?: number` (default 1), `limit?: number` (default 50, max 100)
- **Response:** `{ data: AuditLog[], meta: { total, page, limit, pages } }`
  AuditLog fields: `{ id, companyId, actorId, action, entityType, entityId, meta: JSON, createdAt }`
- **Tenant-scoped?** Yes

---

### Feature: Settings

All endpoints require ADMIN role.

#### `GET /api/v1/settings`
- **Response:** WorkSettings record: `{ id, companyId, minWorkdayHours, defaultCheckoutBuffer }`
- **Tenant-scoped?** Yes

#### `PATCH /api/v1/settings`
- **Request body:** at least one of: `{ minWorkdayHours?: number (int, 1-24); defaultCheckoutBuffer?: number (int, 0-480) }`
- **Response:** Updated WorkSettings
- **Tenant-scoped?** Yes
- **Side-effects:** Audit log.

---

### Feature: Devices (FCM)

#### `POST /api/v1/devices`
- **Role guard:** any authenticated (ADMIN / WORKER / PROVIDER)
- **Request body:** `{ fcmToken: string; platform: "ios" | "android" }`
- **Response:** Created device token record
- **Tenant-scoped?** Yes (tied to userId)

#### `DELETE /api/v1/devices/:token`
- **Role guard:** any authenticated
- **Response:** `200 OK`
- **Tenant-scoped?** Yes

---

### Feature: Provider (cross-tenant, PROVIDER role only)

#### `GET /api/v1/provider/dashboard`
- **Role guard:** PROVIDER
- **Response:** Platform metrics: MRR, total revenue, company counts, recent registrations
- **Tenant-scoped?** No (cross-tenant)

#### `GET /api/v1/provider/payments`
- **Role guard:** PROVIDER
- **Query params:** `from?: Date`, `to?: Date`, `companyId?: string (uuid)`, `status?: PaymentStatus`, `page?: number` (default 1), `limit?: number` (default 20, max 100)
- **Response:** `{ data: Payment[], meta: ... }` plus summary totals
- **Tenant-scoped?** No

#### `GET /api/v1/provider/companies`
- **Role guard:** PROVIDER
- **Query params:** `status?: CompanyStatus`, `subscriptionStatus?: SubStatus`, `search?: string`, `page?: number`, `limit?: number`
- **Response:** `{ data: Company[], meta: ... }`
- **Tenant-scoped?** No

#### `GET /api/v1/provider/companies/:id`
- **Role guard:** PROVIDER
- **Response:** Company detail including employees list + payment history
- **Tenant-scoped?** No

#### `PATCH /api/v1/provider/companies/:id/activate`
- **Role guard:** PROVIDER
- **Request body:** none
- **Response:** `200 OK`
- **Side-effects:** Sets company status ACTIVE, subscription status ACTIVE; audit log.

#### `PATCH /api/v1/provider/companies/:id/suspend`
- **Role guard:** PROVIDER
- **Request body:** none
- **Response:** `200 OK`
- **Side-effects:** Sets company status SUSPENDED; push to company ADMINs; audit log.

---

## 2. Auth Mechanics

### Login
- **Path:** `POST /api/v1/auth/login`
- **Request body:** `{ email: string; password: string }`
- **Response body (JSON):**
  ```ts
  {
    accessToken: string;   // JWT, 15 minutes
    refreshToken: string;  // JWT, 30 days
    user: { id, fullName, email, role, status, companyId }
  }
  ```
- **Both tokens returned in the JSON response body. There are no httpOnly cookies on the backend.**

### Refresh
- **Path:** `POST /api/v1/auth/refresh`
- **Request body:** `{ refreshToken: string }`
- **Response body:** `{ accessToken: string; refreshToken: string }` — **no `user` field** in refresh response
- **Rotation:** The old token ID is deleted from Redis; a new `tokenId` is generated each time.

### Logout
- **Path:** `POST /api/v1/auth/logout`
- **Requires:** Bearer access token in `Authorization` header
- **Request body:** `{ fcmToken?: string }`
- **Response:** `204 No Content`

### JWT Payload (Access Token)
Fields signed into the access token (verified by `JwtStrategy`):
```ts
{ sub: string; role: UserRole; companyId: string | null; status: string }
```
- `sub` = `userId`
- `role` = one of `PROVIDER | ADMIN | WORKER`
- `companyId` = null for PROVIDER users
- `status` = UserStatus at time of token issuance (not re-validated per request from DB)

### JWT Payload (Refresh Token)
```ts
{ sub: string; tokenId: string; type: "refresh" }
```

### Refresh Token Storage (Redis)
- Key pattern: `refresh:<userId>:<tokenId>` = `"1"`
- TTL: 30 days (2,592,000 seconds)
- All tokens for a user can be enumerated via `refresh:<userId>:*` (done on logout to invalidate all sessions)
- Brute-force keys: `bf:<email>:<ip>` = attempt count, TTL = 15 minutes × 60 seconds

### How the Web Layer Handles Tokens
The web app (`/web`) deviates from the backend's cookie-less design in one noteworthy way:
- Access token is stored **in memory** via `tokenStore` (a simple module-level variable, not localStorage)
- Refresh token is sent in the JSON body to `/auth/refresh` (matching the backend)
- The web `CLAUDE.md` spec says "Refresh in httpOnly cookie" but the actual axios interceptor sends the refreshToken in the request body just as the backend expects — this works correctly
- On page load, `AuthProvider` fires `POST /auth/refresh` to restore session

---

## 3. Web Mock Inventory

All mocks live in a single file and are loaded only in `DEV` mode (`import.meta.env.DEV`).

| File | Feature | Type of mock |
|---|---|---|
| `/web/src/shared/api/mock.ts` | auth, users, attendance, requests, schedules, news, office-networks, qr, subscription, payments, audit-logs, settings | Single Axios request interceptor with in-memory mutable stores for all entities; injected at startup in `main.tsx` via `setupMocks()` |
| `/web/src/pages/provider/CompaniesPage.tsx` | provider / companies | Hardcoded `COMPANIES` constant array (7 companies); all activate/suspend mutations work only against local state — no API call |
| `/web/src/pages/provider/ProviderDashboardPage.tsx` | provider / dashboard | Three hardcoded arrays: `MONTHLY_DATA` (12-month chart), `RECENT_REGISTRATIONS` (5 items), `RECENT_PAYMENTS` (5 items); metric values hardcoded as strings |

### Mock Accounts (mock.ts)
- `admin@test.com` / `password123` → role ADMIN, company "ООО «СофтТайм»"
- `provider@test.com` / `password123` → role PROVIDER

### Mock Data Summary
- 5 employees (EMPLOYEES array)
- 5 days × 4 active employees = 20 attendance records (mutable)
- 8 absence requests (mutable)
- 4 news items (mutable)
- 3 office networks (mutable)
- 3 QR tokens (mutable, but backend model has only 1 active token per company)
- 1 subscription object (mutable)
- 3 payment records (immutable)
- 12 audit log entries (immutable)
- 1 company settings object (mutable)

---

## 4. Shared Package Inventory

**Package:** `@softtime/shared`  
**Source:** `/packages/shared/src`  
**Build output:** `dist/index.js`, `dist/index.d.ts` (TypeScript compile only)  
**Export map:** single `"main"` field pointing to `dist/index.js`; no `exports` map in package.json  
**Re-exported from** `src/index.ts`: `enums/*`, `types/*`, `schemas/auth`, `schemas/schedule`, `schemas/request`

---

### Enums (`src/enums/index.ts`)

| Enum | Values |
|---|---|
| `UserRole` | `PROVIDER`, `ADMIN`, `WORKER` |
| `UserStatus` | `PENDING`, `ACTIVE`, `WARNING`, `BLOCKED`, `DELETED` |
| `CompanyStatus` | `TRIAL`, `ACTIVE`, `GRACE`, `SUSPENDED` |
| `SubStatus` | `TRIAL`, `ACTIVE`, `EXPIRED`, `GRACE`, `CANCELLED` |
| `CheckInStatus` | `ON_TIME`, `LATE`, `EARLY_ARRIVAL` |
| `CheckOutStatus` | `ON_TIME`, `LEFT_EARLY`, `OVERTIME` |
| `DayStatus` | `PRESENT`, `LATE`, `ABSENT`, `INCOMPLETE`, `APPROVED_ABSENCE`, `MANUAL`, `EARLY_LEAVE`, `OVERTIME` |
| `RequestType` | `SICK`, `FAMILY`, `VACATION`, `BUSINESS_TRIP`, `REMOTE`, `LATE_REASON`, `EARLY_LEAVE`, `OTHER` |
| `RequestStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED` |
| `Weekday` | `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN` |

---

### TypeScript Interfaces (`src/types/index.ts`)

| Interface | Key fields |
|---|---|
| `Company` | `id, name, companyCode, status: CompanyStatus, createdAt, deletedAt` |
| `Subscription` | `id, companyId, status: SubStatus, priceUsd, periodStart, periodEnd, nextBillingAt` |
| `Payment` | `id, companyId, subscriptionId, amountUsd, periodStart, periodEnd, status: PaymentStatus, provider, providerRef, createdAt` |
| `User` | `id, companyId, role: UserRole, status: UserStatus, fullName, email, passwordHash, avatarUrl, hiredAt, adminNote, deletedAt, createdAt` |
| `EmployeeSchedule` | `id, companyId, userId, weekday: Weekday, isWorkingDay, startTime, endTime, autoCheckoutBuffer` |
| `Attendance` | `id, companyId, userId, date, checkInAt, checkOutAt, checkInStatus, checkOutStatus, status: DayStatus, workedMinutes, isManual, note` |
| `AbsenceRequest` | `id, companyId, userId, type: RequestType, startDate, endDate, desiredTime, comment, status: RequestStatus, decidedBy, decisionNote, createdAt` |
| `OfficeNetwork` | `id, companyId, label, cidr` |
| `QrToken` | `id, companyId, officeNetworkId, token, isActive, createdAt` |
| `News` | `id, companyId, title, body, photoUrl, createdBy, createdAt` |
| `NewsRead` | `id, newsId, userId, readAt` |
| `AuditLog` | `id, companyId, actorId, action, entityType, entityId, meta: JSON, createdAt` |
| `WorkSettings` | `id, companyId, minWorkdayHours, defaultCheckoutBuffer` |

---

### Zod Schemas

| Schema | File | Description |
|---|---|---|
| `registerCompanySchema` | `src/schemas/auth.ts` | `{ companyName, fullName, email, password (min8,max72) }` |
| `registerWorkerSchema` | `src/schemas/auth.ts` | `{ fullName, email, password, companyCode (length 6) }` |
| `loginSchema` | `src/schemas/auth.ts` | `{ email, password }` |
| `dayScheduleSchema` | `src/schemas/schedule.ts` | Single day: weekday, isWorkingDay, startTime, endTime, autoCheckoutBuffer. SuperRefine: working days must span ≥ 6h |
| `scheduleSchema` | `src/schemas/schedule.ts` | `z.array(dayScheduleSchema).length(7)` |
| `absenceRequestSchema` | `src/schemas/request.ts` | `{ type: RequestType, startDate (coerced Date), endDate?, desiredTime? ("HH:mm"), comment? }` |

**Exported type aliases:** `RegisterCompanyDto`, `RegisterWorkerDto`, `LoginDto`, `DayScheduleDto`, `ScheduleDto`, `AbsenceRequestDto`

---

## 5. Gap Table

| Feature | Backend endpoints exist? | Web screen exists? | Web uses mock? | Shared types exist? | Notes |
|---|---|---|---|---|---|
| Auth (login/register/refresh/logout) | Yes | Yes (`/login`, `/register`) | Yes (axios interceptor in mock.ts) | Yes (schemas/auth.ts) | Web expects `user` in refresh response — backend does NOT return it |
| Company info (GET /companies/me) | Yes | No dedicated screen — used indirectly in settings | Via settings mock | Yes (Company interface) | Web never calls `/companies/me`; it calls `/settings` instead |
| Subscription management | Yes (`/subscriptions/me`, `/pay`, `/cancel`) | Yes (SubscriptionPage) | Yes (mock.ts: `/subscription` without "s") | Yes (SubStatus, Subscription) | URL mismatch: web calls `/subscription` (singular), backend is `/subscriptions/me`, `/subscriptions/pay`, `/subscriptions/cancel` |
| Payments | Yes (`GET /payments`) | Yes (SubscriptionPage tab) | Yes (mock.ts) | Yes (PaymentStatus, Payment) | Field mismatch — see gap details below |
| Employees / Users | Yes (full CRUD) | Yes (EmployeesPage, EmployeeDetailPage) | Yes (mock.ts) | Yes (UserRole, UserStatus, User) | HTTP verb mismatch: web calls `POST /users/:id/approve` and `POST /users/:id/reject`; backend expects `PATCH` |
| Employee detail (profile + history) | Yes (`GET /users/:id`) returns `{ user, attendance, requests }` | Yes (EmployeeDetailPage) | Yes (mock returns just the employee object, not the nested shape) | Yes | Response shape mismatch |
| Attendance (company list) | Yes | Yes (AttendancePage) | Yes (mock.ts) | Yes (DayStatus, Attendance) | Field names differ: web uses `checkIn`/`checkOut` (time strings), backend stores `checkInAt`/`checkOutAt` (ISO datetimes) |
| Attendance (who's in office) | Yes (`GET /attendance/today`) | Yes (WhoInOffice widget) | Yes (mock.ts: `/attendance/in-office`) | Yes | URL mismatch: web calls `/attendance/in-office`, backend route is `/attendance/today` |
| Attendance (manual checkout) | Closest is `PATCH /attendance/:id` | Yes (manual-checkout feature) | Yes (mock: `POST /attendance/:id/checkout`) | No | No backend `POST /attendance/:id/checkout` — only `PATCH /attendance/:id`. Endpoint does not exist on backend |
| Attendance (add absence) | Yes (`POST /attendance/manual`) | Yes (add-absence feature) | Yes (mock: `POST /attendance/absence`) | No | URL mismatch: web calls `/attendance/absence`, backend is `/attendance/manual` with a different body shape |
| Schedules | Yes (me, :userId GET, :userId PUT, apply-all) | Yes (SchedulesPage) | Yes (mock.ts) | Yes (Weekday, EmployeeSchedule) | Web calls `GET /schedules` (list all) — no such endpoint on backend. Web calls `POST /schedules/template`, backend is `POST /schedules/apply-all` |
| Requests | Yes (create, list-me, list-company, approve, reject) | Yes (RequestsPage) | Yes (mock.ts) | Yes (RequestType, RequestStatus) | Web uses `POST` for approve/reject; backend uses `PATCH`. No web UI for worker to submit requests |
| News | Yes (list, create, read-stats, detail, mark-read) | Yes (NewsPage) | Yes (mock.ts) | Yes (News) | Web types include `pinned`, `publishedAt`, `readCount`, `totalEmployees` — none of these exist on backend's News model. Web also has `PATCH /news/:id` and `DELETE /news/:id` — neither endpoint exists on the backend |
| Office Networks | Yes | Yes (OfficeNetworksPage) | Yes (mock.ts) | Yes (OfficeNetwork) | Field mismatch: web model has `ssid`, `mode` ("WHITELIST"\|"BLOCKED"), `status` ("ACTIVE"\|"BLOCKED"); backend has only `label` and `cidr`. Web calls `/networks`, backend route is `/office-networks` |
| QR | Yes (`GET /qr`, `POST /qr/regenerate`) | Yes (QrPage) | Yes (mock.ts) | Yes (QrToken) | Web model has `code`, `location`, `updatedAt`; backend has `token`, `isActive`, `officeNetworkId`. Web exposes list/generate/regenerate/delete — backend only has get-active + regenerate |
| Reports | Yes (`GET /reports/attendance`, `GET /reports/attendance/export`) | Yes (ReportsPage) | Yes (mock: `GET /reports`) | No dedicated type | URL mismatch: web calls `/reports`, backend is `/reports/attendance`. Response shape differs (backend returns Prisma raw rows, web expects pre-aggregated `ReportRow[]`) |
| Audit Logs | Yes | Yes (AuditLogPage) | Yes (mock.ts) | Yes (AuditLog) | Field mismatch: web model has `actorEmail`, `target`; backend returns `actorId`, `entityType`, `entityId`, `meta` — no `actorEmail` or `target` field |
| Settings | Yes (`GET /settings`, `PATCH /settings`) | Yes (SettingsPage) | Yes (mock.ts) | Yes (WorkSettings) | Web `CompanySettings` type has `companyName`, `timezone`, `defaultStartTime`, `defaultEndTime`, `autoCheckoutBuffer`, `companyCode`. Backend `WorkSettings` only has `minWorkdayHours` and `defaultCheckoutBuffer`. Most settings fields are mismatched or non-existent |
| Provider dashboard | Yes (`GET /provider/dashboard`) | Yes (ProviderDashboardPage) | Yes (hardcoded page-level arrays — NOT using mock.ts) | No | Page is entirely hardcoded; no API calls |
| Provider companies | Yes (`GET /provider/companies`, activate, suspend, detail) | Yes (CompaniesPage, CompanyDetailPage) | Yes (hardcoded page-level array in CompaniesPage — NOT mock.ts) | Yes (CompanyStatus) | Page is hardcoded; provider actions (activate/suspend) mutate local state only |
| Provider payments | Yes (`GET /provider/payments`) | Yes (PaymentsPage) | Unknown — file not read | No dedicated type | |
| Password change | Yes (via `PATCH /profile`) | Yes (SettingsPage) | Yes (mock: `PATCH /admin/password`) | No | URL mismatch: web calls `/admin/password`, backend is `PATCH /profile` |
| Device FCM tokens | Yes (`POST /devices`, `DELETE /devices/:token`) | No web screen | No mock | No | Mobile-only feature; no web integration |
| Webhooks | Yes (`POST /webhooks/payments`) | No web screen | No | No | Backend/payment provider integration |

---

## 6. Config Check

### Vite Proxy
`/web/vite.config.ts` has **no proxy configuration**. There is no `server.proxy` block.

### Environment Variables
- No `.env`, `.env.example`, or `.env.development` files exist in `/web`
- The axios base URL is configured in `/web/src/shared/config/env.ts`:
  ```ts
  export const env = {
    apiBaseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1",
  };
  ```
- **Default fallback:** `/api/v1` (relative URL). In development, requests go to the same origin (port 5173). There is no proxy, so without `VITE_API_URL` set and without a reverse proxy, the dev frontend cannot reach the backend dev server (port differs, typically 3000).
- To connect dev frontend to backend: set `VITE_API_URL=http://localhost:3000/api/v1` in a `.env.local` file, or add a `server.proxy` entry to `vite.config.ts`.

### Axios Client
- File: `/web/src/shared/api/client.ts`
- Configuration:
  ```ts
  axios.create({
    baseURL: env.apiBaseUrl,  // "/api/v1" by default
    withCredentials: true,     // sends cookies cross-origin
    headers: { "Content-Type": "application/json" },
  })
  ```
- Interceptors (in `/web/src/shared/api/interceptors.ts`):
  - **Request:** Attaches `Authorization: Bearer <accessToken>` from in-memory `tokenStore`
  - **Response:** On 401, silently calls `POST /auth/refresh` to get a new access token, then retries the original request. Queues concurrent requests during the refresh. On refresh failure, redirects to `/login`.

---

*End of Integration Map*
