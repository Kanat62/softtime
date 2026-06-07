/** Роли пользователей в системе */
export enum UserRole {
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
}

/** Статусы пользователя */
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  WARNING = 'WARNING',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

/** Статусы компании (tenant) */
export enum CompanyStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  GRACE = 'GRACE',
  SUSPENDED = 'SUSPENDED',
}

/** Статусы подписки компании */
export enum SubStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  GRACE = 'GRACE',
  CANCELLED = 'CANCELLED',
}

/** Статус прихода (check-in) */
export enum CheckInStatus {
  ON_TIME = 'ON_TIME',
  LATE = 'LATE',
  EARLY_ARRIVAL = 'EARLY_ARRIVAL',
}

/** Статус ухода (check-out) */
export enum CheckOutStatus {
  ON_TIME = 'ON_TIME',
  LEFT_EARLY = 'LEFT_EARLY',
  OVERTIME = 'OVERTIME',
}

/** Общий статус рабочего дня */
export enum DayStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  INCOMPLETE = 'INCOMPLETE',
  APPROVED_ABSENCE = 'APPROVED_ABSENCE',
  MANUAL = 'MANUAL',
  EARLY_LEAVE = 'EARLY_LEAVE',
  OVERTIME = 'OVERTIME',
}

/** Тип заявки сотрудника */
export enum RequestType {
  SICK = 'SICK',
  FAMILY = 'FAMILY',
  VACATION = 'VACATION',
  BUSINESS_TRIP = 'BUSINESS_TRIP',
  REMOTE = 'REMOTE',
  LATE_REASON = 'LATE_REASON',
  EARLY_LEAVE = 'EARLY_LEAVE',
  OTHER = 'OTHER',
}

/** Статус заявки */
export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Статус платежа */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

/** День недели */
export enum Weekday {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}
