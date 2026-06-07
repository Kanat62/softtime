import { UserRole, UserStatus, CompanyStatus, SubStatus, CheckInStatus, CheckOutStatus, DayStatus, RequestType, RequestStatus, PaymentStatus, Weekday } from '../enums';
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
/** Пользователь системы (PROVIDER / ADMIN / WORKER) */
export interface User {
    id: string;
    /** null только у PROVIDER */
    companyId: string | null;
    role: UserRole;
    status: UserStatus;
    fullName: string;
    email: string;
    passwordHash: string;
    avatarUrl: string | null;
    hiredAt: Date | null;
    /** Комментарий администратора */
    adminNote: string | null;
    deletedAt: Date | null;
    createdAt: Date;
}
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
/** Разрешённая офисная сеть/IP компании */
export interface OfficeNetwork {
    id: string;
    companyId: string;
    label: string;
    /** CIDR или одиночный IP, напр. "192.168.1.0/24" */
    cidr: string;
}
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
/** Настройки компании */
export interface WorkSettings {
    id: string;
    companyId: string;
    /** Минимальная длина рабочего дня в часах */
    minWorkdayHours: number;
    /** Буфер автозакрытия по умолчанию в минутах */
    defaultCheckoutBuffer: number;
}
//# sourceMappingURL=index.d.ts.map