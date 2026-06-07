import { UserRole, UserStatus, CompanyStatus, SubStatus, CheckInStatus, CheckOutStatus, DayStatus, RequestType, RequestStatus, PaymentStatus, Weekday } from '../enums';
export interface Company {
    id: string;
    name: string;
    companyCode: string;
    status: CompanyStatus;
    createdAt: Date;
    deletedAt: Date | null;
}
export interface Subscription {
    id: string;
    companyId: string;
    status: SubStatus;
    priceUsd: number;
    periodStart: Date;
    periodEnd: Date;
    nextBillingAt: Date | null;
}
export interface Payment {
    id: string;
    companyId: string;
    subscriptionId: string;
    amountUsd: number;
    periodStart: Date;
    periodEnd: Date;
    status: PaymentStatus;
    provider: string | null;
    providerRef: string | null;
    createdAt: Date;
}
export interface User {
    id: string;
    companyId: string | null;
    role: UserRole;
    status: UserStatus;
    fullName: string;
    email: string;
    passwordHash: string;
    avatarUrl: string | null;
    hiredAt: Date | null;
    adminNote: string | null;
    deletedAt: Date | null;
    createdAt: Date;
}
export interface EmployeeSchedule {
    id: string;
    companyId: string;
    userId: string;
    weekday: Weekday;
    isWorkingDay: boolean;
    startTime: string | null;
    endTime: string | null;
    autoCheckoutBuffer: number;
}
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
    isManual: boolean;
    note: string | null;
}
export interface AbsenceRequest {
    id: string;
    companyId: string;
    userId: string;
    type: RequestType;
    startDate: Date;
    endDate: Date | null;
    desiredTime: string | null;
    comment: string | null;
    status: RequestStatus;
    decidedBy: string | null;
    decisionNote: string | null;
    createdAt: Date;
}
export interface OfficeNetwork {
    id: string;
    companyId: string;
    label: string;
    cidr: string;
}
export interface QrToken {
    id: string;
    companyId: string;
    officeNetworkId: string | null;
    token: string;
    isActive: boolean;
    createdAt: Date;
}
export interface News {
    id: string;
    companyId: string;
    title: string;
    body: string;
    photoUrl: string | null;
    createdBy: string;
    createdAt: Date;
}
export interface NewsRead {
    id: string;
    newsId: string;
    userId: string;
    readAt: Date;
}
export interface AuditLog {
    id: string;
    companyId: string | null;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    meta: Record<string, unknown> | null;
    createdAt: Date;
}
export interface WorkSettings {
    id: string;
    companyId: string;
    minWorkdayHours: number;
    defaultCheckoutBuffer: number;
}
