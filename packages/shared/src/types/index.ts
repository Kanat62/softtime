import {
  UserRole,
  UserStatus,
  CompanyStatus,
  SubStatus,
  CheckInStatus,
  CheckOutStatus,
  DayStatus,
  RequestType,
  RequestStatus,
  PaymentStatus,
  Weekday,
} from '../enums';

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId: string | null;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

// ─── Company ───────────────────────────────────────────────────────────────────

/** Компания (tenant) */
export interface Company {
  id: string;
  name: string;
  /** Уникальный код — ровно 6 символов, генерируется один раз */
  companyCode: string;
  status: CompanyStatus;
  createdAt: Date;
  deletedAt: Date | null;
}

/** Ответ GET /companies/me — компания + вложенная подписка */
export interface CompanyMe extends Company {
  subscription: {
    status: SubStatus;
    priceUsd: number;
    periodStart: Date;
    periodEnd: Date;
    nextBillingAt: Date | null;
  } | null;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

/** Подписка компании */
export interface Subscription {
  id: string;
  companyId: string;
  status: SubStatus;
  /** Фиксированная цена $30/мес */
  priceUsd: number;
  periodStart: Date;
  periodEnd: Date;
  nextBillingAt: Date | null;
}

/** Ответ GET /subscriptions/me — подписка + вычисляемое поле */
export interface SubscriptionWithDaysLeft extends Subscription {
  daysLeft: number;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

/** Платёж по подписке */
export interface Payment {
  id: string;
  companyId: string;
  subscriptionId: string;
  amountUsd: number;
  periodStart: Date;
  periodEnd: Date;
  status: PaymentStatus;
  /** Название платёжного шлюза */
  provider: string | null;
  /** ID транзакции у провайдера */
  providerRef: string | null;
  createdAt: Date;
}

// ─── User ─────────────────────────────────────────────────────────────────────

/**
 * Пользователь системы (PROVIDER / ADMIN / WORKER).
 * passwordHash никогда не возвращается по API — это только DB-поле.
 */
export interface User {
  id: string;
  /** null только у PROVIDER */
  companyId: string | null;
  role: UserRole;
  status: UserStatus;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  hiredAt: Date | null;
  /** Комментарий администратора */
  adminNote: string | null;
  deletedAt: Date | null;
  createdAt: Date;
}

/** Ответ GET /users/:id — профиль + история посещаемости + заявки */
export interface EmployeeProfile {
  user: User;
  attendance: Attendance[];
  requests: AbsenceRequest[];
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

/** Расписание сотрудника на день недели */
export interface EmployeeSchedule {
  id: string;
  companyId: string;
  userId: string;
  weekday: Weekday;
  isWorkingDay: boolean;
  /** Время начала смены, формат "HH:mm" */
  startTime: string | null;
  /** Время конца смены, формат "HH:mm" */
  endTime: string | null;
  /** Буфер автозакрытия в минутах, по умолчанию 60 */
  autoCheckoutBuffer: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

/** Запись посещаемости за день */
export interface Attendance {
  id: string;
  companyId: string;
  userId: string;
  date: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  checkInStatus: CheckInStatus | null;
  checkOutStatus: CheckOutStatus | null;
  status: DayStatus;
  workedMinutes: number | null;
  /** true если запись создана или исправлена вручную администратором */
  isManual: boolean;
  note: string | null;
}

/** Ответ POST /attendance/check-in */
export interface CheckInResponse {
  record: Attendance;
  checkInStatus: CheckInStatus;
  diffMinutes: number;
  message: string;
}

/** Ответ POST /attendance/check-out */
export interface CheckOutResponse {
  record: Attendance;
  checkOutStatus: CheckOutStatus;
  dayStatus: DayStatus;
  workedMinutes: number;
  message: string;
}

// ─── Absence Request ──────────────────────────────────────────────────────────

/** Заявка сотрудника (отсутствие или ранний уход) */
export interface AbsenceRequest {
  id: string;
  companyId: string;
  userId: string;
  type: RequestType;
  startDate: Date;
  endDate: Date | null;
  /** Желаемое время ухода для заявки типа EARLY_LEAVE */
  desiredTime: string | null;
  comment: string | null;
  status: RequestStatus;
  /** ID администратора, принявшего решение */
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: Date;
}

// ─── Office Network ───────────────────────────────────────────────────────────

/** Разрешённая офисная сеть/IP компании */
export interface OfficeNetwork {
  id: string;
  companyId: string;
  label: string;
  /** CIDR или одиночный IP, напр. "192.168.1.0/24" */
  cidr: string;
}

// ─── QR Token ─────────────────────────────────────────────────────────────────

/** QR-токен для верификации прихода/ухода */
export interface QrToken {
  id: string;
  companyId: string;
  officeNetworkId: string | null;
  /** Зашифрованный токен */
  token: string;
  isActive: boolean;
  createdAt: Date;
}

// ─── News ─────────────────────────────────────────────────────────────────────

/** Новость компании */
export interface News {
  id: string;
  companyId: string;
  title: string;
  body: string;
  photoUrl: string | null;
  createdBy: string;
  createdAt: Date;
}

/** Трекинг прочтения новости */
export interface NewsRead {
  id: string;
  newsId: string;
  userId: string;
  readAt: Date;
}

/** Ответ GET /news/:id/reads */
export interface NewsReadStats {
  stats: {
    total: number;
    readCount: number;
    unreadCount: number;
  };
  read: { userId: string; fullName: string; email: string; readAt: Date }[];
  unread: { userId: string; fullName: string; email: string }[];
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

/** Запись в аудит-логе (действия ADMIN/PROVIDER) */
export interface AuditLog {
  id: string;
  /** null для действий PROVIDER на уровне платформы */
  companyId: string | null;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/** Настройки компании */
export interface WorkSettings {
  id: string;
  companyId: string;
  /** Минимальная длина рабочего дня в часах */
  minWorkdayHours: number;
  /** Буфер автозакрытия по умолчанию в минутах */
  defaultCheckoutBuffer: number;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

/** Агрегированная строка отчёта посещаемости по сотруднику */
export interface ReportRow {
  userId: string;
  fullName: string;
  email: string;
  totalWorkedHours: number;
  lateCount: number;
  absentCount: number;
  approvedAbsenceCount: number;
  earliestCheckIn: Date | null;
  latestCheckOut: Date | null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/** Краткая информация о компании (недавние регистрации в дашборде PROVIDER) */
export interface ProviderCompanyBrief {
  id: string;
  name: string;
  companyCode: string;
  status: CompanyStatus;
  createdAt: Date;
}

/** Ответ GET /provider/dashboard */
export interface ProviderDashboard {
  companies: {
    total: number;
    byStatus: Partial<Record<CompanyStatus, number>>;
  };
  revenue: {
    mrr: number;
    total: number;
  };
  recentCompanies: ProviderCompanyBrief[];
  recentPayments: (Payment & {
    subscription: { company: { name: string } } | null;
  })[];
}

/** Элемент списка компаний для PROVIDER (GET /provider/companies) */
export interface ProviderCompanyListItem extends Company {
  subscription: {
    status: SubStatus;
    nextBillingAt: Date | null;
    periodEnd: Date;
  } | null;
  _count: { users: number };
}

/** Платёж с вложенной компанией (для PROVIDER) */
export interface ProviderPaymentWithCompany extends Payment {
  subscription: { company: { id: string; name: string } } | null;
}

/** Ответ GET /provider/payments */
export interface ProviderPaymentsResponse {
  summary: {
    totalAmount: number;
    count: number;
    avgAmount: number;
  };
  data: ProviderPaymentWithCompany[];
  meta: PaginatedMeta;
}

/** Детали компании для PROVIDER (GET /provider/companies/:id) */
export interface ProviderCompanyDetail extends Company {
  subscription: (Subscription & { payments: Payment[] }) | null;
  users: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'status' | 'createdAt'>[];
}
