import { UserRole, UserStatus } from "@softtime/shared";

export type { UserRole, UserStatus };

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  hiredAt: string | null;
  lastActivityAt: string | null;
  avatarUrl: string | null;
  adminNote: string | null;
  companyId: string;
  createdAt: string;
  inn: string | null;
  citizenship: string | null;
  isResident: boolean;
  salary: number | string | null;
}

/** Детальный профиль (те же поля что у Employee) */
export type EmployeeDetail = Employee;

export interface PaginatedEmployees {
  data: Employee[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface EmployeeListParams {
  page: number;
  limit: number;
  status?: UserStatus | "";
  search?: string;
}
