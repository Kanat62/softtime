import { UserStatus } from "@softtime/shared";

export type { UserStatus };

/** Сотрудник как возвращает API (без passwordHash) */
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  status: UserStatus;
  hiredAt: string | null;
  lastActivityAt: string | null;
  avatarUrl: string | null;
  adminNote: string | null;
  companyId: string;
}

/** Детальный профиль (те же поля + опционально расширенные данные от эндпойнта /users/:id) */
export type EmployeeDetail = Employee;

export interface PaginatedEmployees {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
}

export interface EmployeeListParams {
  page: number;
  limit: number;
  status?: UserStatus | "";
  search?: string;
}
