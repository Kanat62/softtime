/**
 * Development mock layer — intercepts axios requests and returns fake data.
 * Imported only in dev mode (see main.tsx).
 *
 * Accounts:
 *   admin@test.com    / password123  → ADMIN
 *   provider@test.com / password123  → PROVIDER
 */

import { UserStatus, DayStatus, RequestType, RequestStatus, Weekday } from "@softtime/shared";
import { apiClient } from "./client";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import type { Employee, EmployeeDetail, PaginatedEmployees } from "@/entities/user/model/types";
import type { AttendanceRow, InOfficeEmployee } from "@/entities/attendance/model/types";
import type { AbsenceRequest } from "@/entities/request/model/types";
import type { ScheduleDay, EmployeeScheduleData } from "@/entities/schedule/model/types";
import type { News, NewsReaders } from "@/entities/news/model/types";
import type { OfficeNetwork } from "@/entities/office-network/model/types";
import type { QrToken } from "@/entities/qr/model/types";
import type { Subscription } from "@/entities/subscription/model/types";
import type { Payment } from "@/entities/payment/model/types";
import type { AuditLog } from "@/entities/audit-log/model/types";
import type { CompanySettings } from "@/entities/company/api";

// ─── Fake users ────────────────────────────────────────────────────────────

const MOCK_COMPANY_ID = "company-001";
const MOCK_COMPANY_CODE = "429183";

const MOCK_USERS = {
  admin: {
    id: "user-admin-001",
    email: "admin@test.com",
    fullName: "Алексей Иванов",
    role: "ADMIN" as const,
    companyId: MOCK_COMPANY_ID,
    companyName: "ООО «СофтТайм»",
  },
  provider: {
    id: "user-prov-001",
    email: "provider@test.com",
    fullName: "Провайдер Системс",
    role: "PROVIDER" as const,
  },
};

const ACCESS_TOKEN = "mock-access-token-dev";

// ─── Fake employees ─────────────────────────────────────────────────────────

const EMPLOYEES: Employee[] = [
  {
    id: "emp-001",
    fullName: "Дмитрий Соколов",
    email: "sokolov@company.com",
    status: UserStatus.ACTIVE,
    hiredAt: "2023-03-15",
    lastActivityAt: "2025-06-04T09:12:00Z",
    avatarUrl: null,
    adminNote: null,
    companyId: MOCK_COMPANY_ID,
  },
  {
    id: "emp-002",
    fullName: "Мария Петрова",
    email: "petrova@company.com",
    status: UserStatus.ACTIVE,
    hiredAt: "2022-11-01",
    lastActivityAt: "2025-06-04T17:45:00Z",
    avatarUrl: null,
    adminNote: "Ответственный сотрудник",
    companyId: MOCK_COMPANY_ID,
  },
  {
    id: "emp-003",
    fullName: "Игорь Кузнецов",
    email: "kuznetsov@company.com",
    status: UserStatus.PENDING,
    hiredAt: null,
    lastActivityAt: null,
    avatarUrl: null,
    adminNote: null,
    companyId: MOCK_COMPANY_ID,
  },
  {
    id: "emp-004",
    fullName: "Анна Николаева",
    email: "nikolaeva@company.com",
    status: UserStatus.ACTIVE,
    hiredAt: "2024-01-10",
    lastActivityAt: "2025-06-03T16:20:00Z",
    avatarUrl: null,
    adminNote: null,
    companyId: MOCK_COMPANY_ID,
  },
  {
    id: "emp-005",
    fullName: "Сергей Морозов",
    email: "morozov@company.com",
    status: UserStatus.BLOCKED,
    hiredAt: "2021-06-01",
    lastActivityAt: "2025-05-20T10:00:00Z",
    avatarUrl: null,
    adminNote: "Заблокирован за нарушение",
    companyId: MOCK_COMPANY_ID,
  },
];

// ─── Fake schedules (mutable store) ─────────────────────────────────────────

function makeWeekSchedule(
  opts: { startTime: string; endTime: string; workDays?: number } = {
    startTime: "09:00",
    endTime: "18:00",
    workDays: 5,
  },
): ScheduleDay[] {
  const days = [
    Weekday.MON,
    Weekday.TUE,
    Weekday.WED,
    Weekday.THU,
    Weekday.FRI,
    Weekday.SAT,
    Weekday.SUN,
  ];
  return days.map((weekday, idx) => ({
    weekday,
    isWorkingDay: idx < (opts.workDays ?? 5),
    startTime: idx < (opts.workDays ?? 5) ? opts.startTime : null,
    endTime: idx < (opts.workDays ?? 5) ? opts.endTime : null,
    autoCheckoutBuffer: 60,
  }));
}

const schedules: Record<string, ScheduleDay[]> = {
  "emp-001": makeWeekSchedule({ startTime: "09:00", endTime: "18:00" }),
  "emp-002": makeWeekSchedule({ startTime: "08:30", endTime: "17:30" }),
  "emp-003": makeWeekSchedule({ startTime: "09:00", endTime: "18:00" }),
  "emp-004": makeWeekSchedule({ startTime: "10:00", endTime: "19:00" }),
  "emp-005": makeWeekSchedule({ startTime: "09:00", endTime: "21:00", workDays: 6 }),
};

function getOrCreateSchedule(userId: string): ScheduleDay[] {
  if (!schedules[userId]) {
    schedules[userId] = makeWeekSchedule({ startTime: "09:00", endTime: "18:00" });
  }
  return schedules[userId];
}

// ─── Fake attendance (mutable store) ────────────────────────────────────────

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function buildAttendance(): AttendanceRow[] {
  const days = [
    {
      date: isoDate(0),
      checkIn: "09:05",
      checkOut: null,
      minutes: null,
      status: DayStatus.INCOMPLETE,
    },
    {
      date: isoDate(1),
      checkIn: "09:05",
      checkOut: "18:10",
      minutes: 545,
      status: DayStatus.PRESENT,
    },
    {
      date: isoDate(2),
      checkIn: "08:58",
      checkOut: "18:00",
      minutes: 542,
      status: DayStatus.PRESENT,
    },
    { date: isoDate(3), checkIn: null, checkOut: null, minutes: null, status: DayStatus.ABSENT },
    { date: isoDate(4), checkIn: "09:30", checkOut: "17:45", minutes: 495, status: DayStatus.LATE },
  ];
  return EMPLOYEES.filter((e) => e.status === UserStatus.ACTIVE).flatMap((emp, ei) =>
    days.map((d, di) => ({
      id: `att-${emp.id}-${di}`,
      userId: emp.id,
      date: d.date,
      checkIn: d.checkIn,
      checkOut: ei === 1 && di === 0 ? "18:30" : d.checkOut, // emp-002 already checked out today
      workedMinutes: ei === 1 && di === 0 ? 510 : d.minutes,
      status: ei === 1 && di === 0 ? DayStatus.PRESENT : d.status,
      isManual: false,
      note: null,
    })),
  );
}

let attRecords: AttendanceRow[] = buildAttendance();

// ─── In-office store ─────────────────────────────────────────────────────────

let inOfficeList: InOfficeEmployee[] = [
  {
    attendanceId: "att-emp-001-0",
    userId: "emp-001",
    fullName: "Дмитрий Соколов",
    checkIn: "09:05",
  },
  {
    attendanceId: "att-emp-004-0",
    userId: "emp-004",
    fullName: "Анна Николаева",
    checkIn: "09:15",
  },
];

// ─── Fake requests (mutable store) ────────────────────────────────────────────

let requests: AbsenceRequest[] = [
  {
    id: "req-001",
    userId: "emp-001",
    type: RequestType.VACATION,
    startDate: "2026-07-01",
    endDate: "2026-07-14",
    comment: "Ежегодный плановый отпуск",
    status: RequestStatus.PENDING,
    decisionNote: null,
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "req-002",
    userId: "emp-002",
    type: RequestType.SICK,
    startDate: "2026-06-03",
    endDate: "2026-06-05",
    comment: "ОРВИ, есть справка от врача",
    status: RequestStatus.PENDING,
    decisionNote: null,
    createdAt: "2026-06-02T09:15:00Z",
  },
  {
    id: "req-003",
    userId: "emp-004",
    type: RequestType.FAMILY,
    startDate: "2026-06-07",
    endDate: null,
    comment: "Семейные обстоятельства",
    status: RequestStatus.PENDING,
    decisionNote: null,
    createdAt: "2026-06-04T11:30:00Z",
  },
  {
    id: "req-004",
    userId: "emp-001",
    type: RequestType.REMOTE,
    startDate: "2026-05-20",
    endDate: "2026-05-24",
    comment: "Удалённая работа на неделю",
    status: RequestStatus.APPROVED,
    decisionNote: "Согласовано с отделом",
    createdAt: "2026-05-15T10:00:00Z",
  },
  {
    id: "req-005",
    userId: "emp-002",
    type: RequestType.LATE_REASON,
    startDate: "2026-05-15",
    endDate: null,
    comment: "Опоздание из-за аварии на дороге",
    status: RequestStatus.REJECTED,
    decisionNote: "Не принята без документа",
    createdAt: "2026-05-14T08:00:00Z",
  },
  {
    id: "req-006",
    userId: "emp-004",
    type: RequestType.BUSINESS_TRIP,
    startDate: "2026-06-15",
    endDate: "2026-06-18",
    comment: "Командировка в Алматы",
    status: RequestStatus.PENDING,
    decisionNote: null,
    createdAt: "2026-06-05T14:00:00Z",
  },
  {
    id: "req-007",
    userId: "emp-001",
    type: RequestType.EARLY_LEAVE,
    startDate: "2026-06-10",
    endDate: null,
    comment: "Врачебный приём в 16:00",
    status: RequestStatus.PENDING,
    decisionNote: null,
    createdAt: "2026-06-09T09:00:00Z",
  },
  {
    id: "req-008",
    userId: "emp-002",
    type: RequestType.VACATION,
    startDate: "2026-08-01",
    endDate: "2026-08-10",
    comment: "Летний отпуск",
    status: RequestStatus.APPROVED,
    decisionNote: "Одобрено",
    createdAt: "2026-05-25T10:00:00Z",
  },
];

// ─── Fake news (mutable) ─────────────────────────────────────────────────────

let newsList: News[] = [
  {
    id: "news-001",
    title: "График работы на День независимости",
    body: "1 сентября — выходной. 2 сентября работаем по обычному графику.",
    publishedAt: "2026-06-02T10:00:00Z",
    pinned: true,
    photoUrl: null,
    readCount: 4,
    totalEmployees: 4,
  },
  {
    id: "news-002",
    title: "Новый кулер на кухне",
    body: "Установлен новый кулер. Бутылки заказываются по понедельникам.",
    publishedAt: "2026-05-28T09:00:00Z",
    pinned: false,
    photoUrl: null,
    readCount: 3,
    totalEmployees: 4,
  },
  {
    id: "news-003",
    title: "Корпоратив 15 июня",
    body: 'Сбор в 18:00 в офисе, далее переезжаем в ресторан "Plov Center".',
    publishedAt: "2026-05-20T14:00:00Z",
    pinned: false,
    photoUrl: null,
    readCount: 4,
    totalEmployees: 4,
  },
  {
    id: "news-004",
    title: "Изменение графика по пятницам",
    body: "С 1 июня пятница — сокращённый день до 17:00.",
    publishedAt: "2026-05-10T11:00:00Z",
    pinned: false,
    photoUrl: null,
    readCount: 3,
    totalEmployees: 4,
  },
];

const newsReadersMap: Record<string, Set<string>> = {
  "news-001": new Set(["emp-001", "emp-002", "emp-003", "emp-004"]),
  "news-002": new Set(["emp-001", "emp-002", "emp-004"]),
  "news-003": new Set(["emp-001", "emp-002", "emp-003", "emp-004"]),
  "news-004": new Set(["emp-001", "emp-002", "emp-004"]),
};

// ─── Fake office networks (mutable) ─────────────────────────────────────────

let networks: OfficeNetwork[] = [
  {
    id: "net-001",
    ssid: "SoftTime-Office",
    cidr: "192.168.1.0/24",
    mode: "WHITELIST",
    status: "ACTIVE",
  },
  {
    id: "net-002",
    ssid: "SoftTime-Guest",
    cidr: "192.168.2.0/24",
    mode: "BLOCKED",
    status: "BLOCKED",
  },
  {
    id: "net-003",
    ssid: "Branch-Yunusabad",
    cidr: "10.10.0.0/16",
    mode: "WHITELIST",
    status: "ACTIVE",
  },
];

// ─── Fake QR tokens (mutable) ────────────────────────────────────────────────

function randomQrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return (
    "ST-" +
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") +
    "-" +
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
}

let qrTokens: QrToken[] = [
  {
    id: "qr-001",
    code: "ST-MAIN-7K2L",
    location: "Главный вход",
    networkId: "net-001",
    updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "qr-002",
    code: "ST-KITC-9M3P",
    location: "Кухня",
    networkId: "net-001",
    updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "qr-003",
    code: "ST-CONF-4N8Q",
    location: "Конференц-зал",
    networkId: "net-002",
    updatedAt: "2026-06-02T08:00:00Z",
  },
];

// ─── Fake subscription ───────────────────────────────────────────────────────

let subscription: Subscription = {
  id: "sub-001",
  companyId: MOCK_COMPANY_ID,
  plan: "SoftTime Pro",
  status: "TRIAL",
  nextBillingDate: "2026-07-04",
  amount: 30,
};

// ─── Fake payments ───────────────────────────────────────────────────────────

const paymentsList: Payment[] = [
  {
    id: "pay-001",
    companyId: MOCK_COMPANY_ID,
    amount: 30,
    currency: "USD",
    method: "Visa •••• 4242",
    status: "PAID",
    date: "2026-05-10T10:00:00Z",
    invoiceNumber: "INV-2026-005",
  },
  {
    id: "pay-002",
    companyId: MOCK_COMPANY_ID,
    amount: 30,
    currency: "USD",
    method: "Visa •••• 4242",
    status: "PAID",
    date: "2026-04-10T10:00:00Z",
    invoiceNumber: "INV-2026-004",
  },
  {
    id: "pay-003",
    companyId: MOCK_COMPANY_ID,
    amount: 30,
    currency: "USD",
    method: "Visa •••• 4242",
    status: "PAID",
    date: "2026-03-10T10:00:00Z",
    invoiceNumber: "INV-2026-003",
  },
];

// ─── Fake audit logs ─────────────────────────────────────────────────────────

const auditLogsList: AuditLog[] = [
  {
    id: "audit-001",
    actorEmail: "admin@test.com",
    action: "APPROVE_REQUEST",
    target: "Каримова Зарина (Отпуск)",
    createdAt: "2026-06-04T14:32:00Z",
  },
  {
    id: "audit-002",
    actorEmail: "admin@test.com",
    action: "CREATE_SCHEDULE",
    target: "Сменный (6/1)",
    createdAt: "2026-06-04T13:18:00Z",
  },
  {
    id: "audit-003",
    actorEmail: "admin@test.com",
    action: "UPDATE_EMPLOYEE",
    target: "Алиев Рустам",
    createdAt: "2026-06-04T11:05:00Z",
  },
  {
    id: "audit-004",
    actorEmail: "admin@test.com",
    action: "LOGIN",
    target: "IP 213.230.97.12",
    createdAt: "2026-06-04T09:47:00Z",
  },
  {
    id: "audit-005",
    actorEmail: "admin@test.com",
    action: "BLOCK_EMPLOYEE",
    target: "Юсупова Дилфуза",
    createdAt: "2026-06-03T17:22:00Z",
  },
  {
    id: "audit-006",
    actorEmail: "admin@test.com",
    action: "CREATE_EMPLOYEE",
    target: "Норматова Севара",
    createdAt: "2026-06-03T15:10:00Z",
  },
  {
    id: "audit-007",
    actorEmail: "admin@test.com",
    action: "UPDATE_NETWORK",
    target: "SoftTime-Office",
    createdAt: "2026-06-03T10:01:00Z",
  },
  {
    id: "audit-008",
    actorEmail: "admin@test.com",
    action: "REJECT_REQUEST",
    target: "Морозов Сергей (Больничный)",
    createdAt: "2026-06-02T16:45:00Z",
  },
  {
    id: "audit-009",
    actorEmail: "admin@test.com",
    action: "PUBLISH_NEWS",
    target: "График работы на День независимости",
    createdAt: "2026-06-02T10:00:00Z",
  },
  {
    id: "audit-010",
    actorEmail: "admin@test.com",
    action: "REGENERATE_QR",
    target: "Главный вход",
    createdAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "audit-011",
    actorEmail: "admin@test.com",
    action: "UPDATE_SCHEDULE",
    target: "Дмитрий Соколов",
    createdAt: "2026-06-01T11:20:00Z",
  },
  {
    id: "audit-012",
    actorEmail: "admin@test.com",
    action: "MANUAL_CHECKOUT",
    target: "Анна Николаева",
    createdAt: "2026-05-31T18:05:00Z",
  },
];

// ─── Fake company settings ───────────────────────────────────────────────────

let companySettings: CompanySettings = {
  companyName: "ООО «СофтТайм»",
  timezone: "Asia/Tashkent (UTC+5)",
  defaultStartTime: "09:00",
  defaultEndTime: "18:00",
  autoCheckoutBuffer: 60,
  companyCode: MOCK_COMPANY_CODE,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

function fail(status: number, message: string): never {
  const err = Object.assign(new Error(message), {
    response: { status, data: { message } },
    isAxiosError: true,
  });
  throw err;
}

function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), total: items.length, page, limit };
}

// ─── Request interceptor ─────────────────────────────────────────────────────

let employees = [...EMPLOYEES];

export function setupMocks() {
  apiClient.interceptors.request.use(async (config) => {
    const method = (config.method ?? "get").toUpperCase();
    const url = config.url ?? "";

    await new Promise((r) => setTimeout(r, 150));

    const body: Record<string, unknown> =
      typeof config.data === "string" ? JSON.parse(config.data) : (config.data ?? {});

    // ── Auth ──────────────────────────────────────────────────────────────

    if (method === "POST" && url === "/auth/login") {
      const user =
        body.email === "admin@test.com"
          ? MOCK_USERS.admin
          : body.email === "provider@test.com"
            ? MOCK_USERS.provider
            : null;
      if (!user || body.password !== "password123") fail(401, "Неверный email или пароль");
      sessionStorage.setItem("mock_session", JSON.stringify({ accessToken: ACCESS_TOKEN, user }));
      throw { __mock: true, response: ok({ accessToken: ACCESS_TOKEN, user }) };
    }

    if (method === "POST" && url === "/auth/register/company") {
      const newUser = {
        ...MOCK_USERS.admin,
        id: `user-${Date.now()}`,
        email: body.email,
        fullName: body.fullName,
        companyName: body.companyName,
      };
      throw {
        __mock: true,
        response: ok({ accessToken: ACCESS_TOKEN, user: newUser, companyCode: MOCK_COMPANY_CODE }),
      };
    }

    if (method === "POST" && url === "/auth/refresh") {
      const stored = sessionStorage.getItem("mock_session");
      if (stored) {
        const { accessToken, user } = JSON.parse(stored) as { accessToken: string; user: unknown };
        throw { __mock: true, response: ok({ accessToken, user }) };
      }
      fail(401, "No session");
    }

    if (method === "POST" && url === "/auth/logout") {
      sessionStorage.removeItem("mock_session");
      throw { __mock: true, response: ok({}) };
    }

    // ── Users ──────────────────────────────────────────────────────────────

    if (method === "GET" && url === "/users") {
      const p = config.params ?? {};
      let result = [...employees];
      if (p.status) result = result.filter((e) => e.status === p.status);
      if (p.search) {
        const q = String(p.search).toLowerCase();
        result = result.filter(
          (e) => e.fullName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q),
        );
      }
      const paginated: PaginatedEmployees = paginate(
        result,
        Number(p.page) || 1,
        Number(p.limit) || 20,
      );
      throw { __mock: true, response: ok(paginated) };
    }

    const userIdMatch = url.match(/^\/users\/([^/]+)$/);
    if (method === "GET" && userIdMatch) {
      const emp = employees.find((e) => e.id === userIdMatch[1]);
      if (!emp) fail(404, "Not found");
      throw { __mock: true, response: ok(emp as EmployeeDetail) };
    }

    const approveMatch = url.match(/^\/users\/([^/]+)\/approve$/);
    if (method === "POST" && approveMatch) {
      employees = employees.map((e) =>
        e.id === approveMatch[1]
          ? { ...e, status: UserStatus.ACTIVE, hiredAt: new Date().toISOString().slice(0, 10) }
          : e,
      );
      throw { __mock: true, response: ok(employees.find((e) => e.id === approveMatch[1])!) };
    }

    const rejectMatch = url.match(/^\/users\/([^/]+)\/reject$/);
    if (method === "POST" && rejectMatch) {
      employees = employees.filter((e) => e.id !== rejectMatch[1]);
      throw { __mock: true, response: ok({}) };
    }

    const statusMatch = url.match(/^\/users\/([^/]+)\/status$/);
    if (method === "PATCH" && statusMatch) {
      employees = employees.map((e) =>
        e.id === statusMatch[1] ? { ...e, status: body.status as UserStatus } : e,
      );
      throw { __mock: true, response: ok(employees.find((e) => e.id === statusMatch[1])!) };
    }

    const deleteMatch = url.match(/^\/users\/([^/]+)$/);
    if (method === "DELETE" && deleteMatch) {
      employees = employees.filter((e) => e.id !== deleteMatch[1]);
      throw { __mock: true, response: ok({}) };
    }

    const noteMatch = url.match(/^\/users\/([^/]+)\/note$/);
    if (method === "PATCH" && noteMatch) {
      employees = employees.map((e) =>
        e.id === noteMatch[1] ? { ...e, adminNote: body.note as string } : e,
      );
      throw { __mock: true, response: ok(employees.find((e) => e.id === noteMatch[1])!) };
    }

    // ── Attendance: specific routes first ─────────────────────────────────

    // GET /attendance/in-office
    if (method === "GET" && url === "/attendance/in-office") {
      throw { __mock: true, response: ok(inOfficeList) };
    }

    // POST /attendance/absence
    if (method === "POST" && url === "/attendance/absence") {
      const emp = employees.find((e) => e.id === body.userId);
      const newRow: AttendanceRow = {
        id: `att-manual-${Date.now()}`,
        userId: body.userId as string,
        date: body.date as string,
        checkIn: null,
        checkOut: null,
        workedMinutes: null,
        status: body.status as DayStatus,
        isManual: true,
        note: body.note as string,
      };
      attRecords = [newRow, ...attRecords];
      inOfficeList = inOfficeList.filter((e) => e.userId !== body.userId);
      void emp;
      throw { __mock: true, response: ok(newRow) };
    }

    // POST /attendance/:id/checkout
    const checkoutMatch = url.match(/^\/attendance\/([^/]+)\/checkout$/);
    if (method === "POST" && checkoutMatch) {
      const id = checkoutMatch[1];
      attRecords = attRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              checkOut: body.checkOut as string,
              isManual: true,
              status: DayStatus.PRESENT,
              workedMinutes: 480,
            }
          : r,
      );
      inOfficeList = inOfficeList.filter((e) => e.attendanceId !== id);
      const updated = attRecords.find((r) => r.id === id)!;
      throw { __mock: true, response: ok(updated) };
    }

    // PATCH /attendance/:id
    const attPatchMatch = url.match(/^\/attendance\/([^/]+)$/);
    if (method === "PATCH" && attPatchMatch) {
      const id = attPatchMatch[1];
      attRecords = attRecords.map((r) => {
        if (r.id !== id) return r;
        const checkIn = "checkIn" in body ? (body.checkIn as string | null) : r.checkIn;
        const checkOut = "checkOut" in body ? (body.checkOut as string | null) : r.checkOut;
        let minutes = r.workedMinutes;
        if (checkIn && checkOut) {
          const [h1, m1] = checkIn.split(":").map(Number);
          const [h2, m2] = checkOut.split(":").map(Number);
          minutes = h2 * 60 + m2 - (h1 * 60 + m1);
        }
        return {
          ...r,
          checkIn,
          checkOut,
          workedMinutes: minutes,
          note: "note" in body ? (body.note as string | null) : r.note,
          isManual: true,
          status:
            checkIn && !checkOut ? DayStatus.INCOMPLETE : checkIn ? DayStatus.PRESENT : r.status,
        };
      });
      const updated = attRecords.find((r) => r.id === id)!;
      throw { __mock: true, response: ok(updated) };
    }

    // GET /attendance (list with filters)
    if (method === "GET" && url === "/attendance") {
      const p = config.params ?? {};
      let result = [...attRecords];
      if (p.userId) result = result.filter((r) => r.userId === p.userId);
      if (p.dateFrom) result = result.filter((r) => r.date >= p.dateFrom);
      if (p.dateTo) result = result.filter((r) => r.date <= p.dateTo);
      if (p.status) result = result.filter((r) => r.status === p.status);
      result.sort((a, b) => b.date.localeCompare(a.date));
      throw {
        __mock: true,
        response: ok(paginate(result, Number(p.page) || 1, Number(p.limit) || 20)),
      };
    }

    // ── Requests ──────────────────────────────────────────────────────────

    if (method === "GET" && url === "/requests") {
      const p = config.params ?? {};
      let result = [...requests];
      if (p.userId) result = result.filter((r) => r.userId === p.userId);
      if (p.status) result = result.filter((r) => r.status === p.status);
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      throw {
        __mock: true,
        response: ok(paginate(result, Number(p.page) || 1, Number(p.limit) || 20)),
      };
    }

    const reqApproveMatch = url.match(/^\/requests\/([^/]+)\/approve$/);
    if (method === "POST" && reqApproveMatch) {
      const id = reqApproveMatch[1];
      requests = requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: RequestStatus.APPROVED,
              decisionNote: (body.decisionNote as string | null) ?? null,
            }
          : r,
      );
      throw { __mock: true, response: ok(requests.find((r) => r.id === id)!) };
    }

    const reqRejectMatch = url.match(/^\/requests\/([^/]+)\/reject$/);
    if (method === "POST" && reqRejectMatch) {
      const id = reqRejectMatch[1];
      requests = requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: RequestStatus.REJECTED,
              decisionNote: (body.decisionNote as string) ?? null,
            }
          : r,
      );
      throw { __mock: true, response: ok(requests.find((r) => r.id === id)!) };
    }

    // ── Schedules ─────────────────────────────────────────────────────────

    // POST /schedules/template — must come before the /:userId match
    if (method === "POST" && url === "/schedules/template") {
      const { days, userIds } = body as { days: ScheduleDay[]; userIds?: string[] };
      const targets = userIds && userIds.length > 0 ? userIds : employees.map((e) => e.id);
      for (const uid of targets) schedules[uid] = days;
      throw { __mock: true, response: ok({}) };
    }

    // GET /schedules — все расписания
    if (method === "GET" && url === "/schedules") {
      const result: EmployeeScheduleData[] = employees.map((e) => ({
        userId: e.id,
        days: getOrCreateSchedule(e.id),
      }));
      throw { __mock: true, response: ok(result) };
    }

    const scheduleUserMatch = url.match(/^\/schedules\/([^/]+)$/);

    // GET /schedules/:userId
    if (method === "GET" && scheduleUserMatch) {
      throw { __mock: true, response: ok(getOrCreateSchedule(scheduleUserMatch[1])) };
    }

    // PUT /schedules/:userId
    if (method === "PUT" && scheduleUserMatch) {
      const { days } = body as { days: ScheduleDay[] };
      schedules[scheduleUserMatch[1]] = days;
      throw { __mock: true, response: ok(days) };
    }

    // ── News ──────────────────────────────────────────────────────────────

    if (method === "GET" && url === "/news") {
      const result = [...newsList].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.publishedAt.localeCompare(a.publishedAt);
      });
      throw { __mock: true, response: ok(result) };
    }

    const newsIdMatch = url.match(/^\/news\/([^/]+)$/);
    if (method === "GET" && newsIdMatch && !url.endsWith("/readers")) {
      const item = newsList.find((n) => n.id === newsIdMatch[1]);
      if (!item) fail(404, "Not found");
      throw { __mock: true, response: ok(item!) };
    }

    const newsReadersMatch = url.match(/^\/news\/([^/]+)\/readers$/);
    if (method === "GET" && newsReadersMatch) {
      const nid = newsReadersMatch[1];
      const readerSet = newsReadersMap[nid] ?? new Set<string>();
      const activeEmps = employees.filter((e) => e.status === UserStatus.ACTIVE);
      const readList = activeEmps
        .filter((e) => readerSet.has(e.id))
        .map((e) => ({
          newsId: nid,
          userId: e.id,
          fullName: e.fullName,
          readAt: new Date(Date.now() - 3600_000).toISOString(),
        }));
      const unreadList = activeEmps
        .filter((e) => !readerSet.has(e.id))
        .map((e) => ({ userId: e.id, fullName: e.fullName }));
      const readers: NewsReaders = { read: readList, unread: unreadList, total: activeEmps.length };
      throw { __mock: true, response: ok(readers) };
    }

    if (method === "POST" && url === "/news") {
      const item: News = {
        id: `news-${Date.now()}`,
        title: body.title as string,
        body: body.body as string,
        publishedAt: new Date().toISOString(),
        pinned: (body.pinned as boolean) ?? false,
        photoUrl: (body.photoUrl as string | null) ?? null,
        readCount: 0,
        totalEmployees: employees.filter((e) => e.status === UserStatus.ACTIVE).length,
      };
      newsList = [item, ...newsList];
      newsReadersMap[item.id] = new Set();
      throw { __mock: true, response: ok(item) };
    }

    if (method === "PATCH" && newsIdMatch) {
      newsList = newsList.map((n) =>
        n.id === newsIdMatch[1] ? { ...n, ...(body as Partial<News>) } : n,
      );
      throw { __mock: true, response: ok(newsList.find((n) => n.id === newsIdMatch[1])!) };
    }

    if (method === "DELETE" && newsIdMatch) {
      newsList = newsList.filter((n) => n.id !== newsIdMatch[1]);
      throw { __mock: true, response: ok({}) };
    }

    // ── Office Networks ───────────────────────────────────────────────────

    if (method === "GET" && url === "/networks") {
      throw { __mock: true, response: ok(networks) };
    }

    if (method === "POST" && url === "/networks") {
      const item: OfficeNetwork = {
        id: `net-${Date.now()}`,
        ssid: body.ssid as string,
        cidr: body.cidr as string,
        mode: (body.mode as "WHITELIST" | "BLOCKED") ?? "WHITELIST",
        status: "ACTIVE",
      };
      networks = [item, ...networks];
      throw { __mock: true, response: ok(item) };
    }

    const netIdMatch = url.match(/^\/networks\/([^/]+)$/);
    if (method === "PATCH" && netIdMatch) {
      networks = networks.map((n) =>
        n.id === netIdMatch[1] ? { ...n, ...(body as Partial<OfficeNetwork>) } : n,
      );
      throw { __mock: true, response: ok(networks.find((n) => n.id === netIdMatch[1])!) };
    }

    if (method === "DELETE" && netIdMatch) {
      networks = networks.filter((n) => n.id !== netIdMatch[1]);
      throw { __mock: true, response: ok({}) };
    }

    // ── QR Tokens ─────────────────────────────────────────────────────────

    if (method === "GET" && url === "/qr") {
      throw { __mock: true, response: ok(qrTokens) };
    }

    if (method === "POST" && url === "/qr/generate") {
      const item: QrToken = {
        id: `qr-${Date.now()}`,
        code: randomQrCode(),
        location: body.location as string,
        networkId: (body.networkId as string) ?? null,
        updatedAt: new Date().toISOString(),
      };
      qrTokens = [...qrTokens, item];
      throw { __mock: true, response: ok(item) };
    }

    const qrRegenMatch = url.match(/^\/qr\/([^/]+)\/regenerate$/);
    if (method === "POST" && qrRegenMatch) {
      qrTokens = qrTokens.map((q) =>
        q.id === qrRegenMatch[1]
          ? { ...q, code: randomQrCode(), updatedAt: new Date().toISOString() }
          : q,
      );
      throw { __mock: true, response: ok(qrTokens.find((q) => q.id === qrRegenMatch[1])!) };
    }

    const qrIdMatch = url.match(/^\/qr\/([^/]+)$/);
    if (method === "DELETE" && qrIdMatch) {
      qrTokens = qrTokens.filter((q) => q.id !== qrIdMatch[1]);
      throw { __mock: true, response: ok({}) };
    }

    // ── Subscription ──────────────────────────────────────────────────────

    if (method === "GET" && url === "/subscription") {
      throw { __mock: true, response: ok(subscription) };
    }

    if (method === "POST" && url === "/subscription/pay") {
      subscription = {
        ...subscription,
        status: "ACTIVE" as Subscription["status"],
        nextBillingDate: "2026-08-04",
      };
      throw { __mock: true, response: ok(subscription) };
    }

    if (method === "DELETE" && url === "/subscription/cancel") {
      subscription = { ...subscription, status: "GRACE" as Subscription["status"] };
      throw { __mock: true, response: ok(subscription) };
    }

    // ── Payments ──────────────────────────────────────────────────────────

    if (method === "GET" && url === "/payments") {
      const p = config.params ?? {};
      throw {
        __mock: true,
        response: ok(paginate(paymentsList, Number(p.page) || 1, Number(p.limit) || 20)),
      };
    }

    // ── Audit Logs ────────────────────────────────────────────────────────

    if (method === "GET" && url === "/audit-logs") {
      const p = config.params ?? {};
      let result = [...auditLogsList];
      if (p.dateFrom) result = result.filter((l) => l.createdAt >= p.dateFrom);
      if (p.dateTo) result = result.filter((l) => l.createdAt <= p.dateTo + "T23:59:59Z");
      if (p.action) result = result.filter((l) => l.action === p.action);
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      throw {
        __mock: true,
        response: ok(paginate(result, Number(p.page) || 1, Number(p.limit) || 20)),
      };
    }

    // ── Settings ──────────────────────────────────────────────────────────

    if (method === "GET" && url === "/settings") {
      throw { __mock: true, response: ok(companySettings) };
    }

    if (method === "PATCH" && url === "/settings") {
      companySettings = { ...companySettings, ...(body as Partial<CompanySettings>) };
      throw { __mock: true, response: ok(companySettings) };
    }

    if (method === "PATCH" && url === "/admin/password") {
      if (body.currentPassword !== "password123") fail(400, "Неверный текущий пароль");
      throw { __mock: true, response: ok({ message: "Пароль изменён" }) };
    }

    // ── Reports ───────────────────────────────────────────────────────────

    if (method === "GET" && url === "/reports") {
      const activeEmps = employees.filter((e) => e.status === UserStatus.ACTIVE);
      const reportRows = activeEmps.map((emp) => {
        const empAtt = attRecords.filter((r) => r.userId === emp.id);
        const workedMinutes = empAtt.reduce((s, r) => s + (r.workedMinutes ?? 0), 0);
        const lateCount = empAtt.filter((r) => r.status === DayStatus.LATE).length;
        const absentCount = empAtt.filter(
          (r) => r.status === DayStatus.ABSENT || r.status === DayStatus.INCOMPLETE,
        ).length;
        const approvedCount = empAtt.filter((r) => r.status === DayStatus.APPROVED_ABSENCE).length;
        const workDays = empAtt.filter((r) => r.status !== DayStatus.ABSENT).length;
        const punctuality =
          workDays > 0 ? Math.round(((workDays - lateCount) / workDays) * 100) : 100;
        return {
          userId: emp.id,
          fullName: emp.fullName,
          workedHours: Math.round((workedMinutes / 60) * 10) / 10,
          lateCount,
          absentCount,
          approvedAbsenceCount: approvedCount,
          punctualityPercent: punctuality,
        };
      });
      throw { __mock: true, response: ok(reportRows) };
    }

    return config;
  });

  apiClient.interceptors.response.use(undefined, (error) => {
    if (error?.__mock) return Promise.resolve(error.response);
    return Promise.reject(error);
  });
}
