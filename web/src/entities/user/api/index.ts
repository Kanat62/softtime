import { UserStatus } from "@softtime/shared";
import { request } from "@/shared/api/request";
import type {
  Employee,
  EmployeeDetail,
  EmployeeListParams,
  PaginatedEmployees,
} from "../model/types";

export const userApi = {
  /** GET /users?page&limit&status&search */
  listEmployees: (params: EmployeeListParams) =>
    request<PaginatedEmployees>({
      method: "GET",
      url: "/users",
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.status ? { status: params.status } : {}),
        ...(params.search ? { search: params.search } : {}),
      },
    }),

  /** GET /users/:id — backend returns { user, attendance, requests }; we extract user */
  getEmployee: (id: string) =>
    request<{ user: Employee; attendance: unknown[]; requests: unknown[] }>({
      method: "GET",
      url: `/users/${id}`,
    }).then((res) => res.user as EmployeeDetail),

  /** PATCH /users/:id/approve — принять PENDING сотрудника */
  approveEmployee: (id: string) =>
    request<Employee>({ method: "PATCH", url: `/users/${id}/approve` }),

  /** PATCH /users/:id/reject — отклонить PENDING сотрудника (мягкое удаление) */
  rejectEmployee: (id: string) =>
    request<void>({ method: "PATCH", url: `/users/${id}/reject` }),

  /** PATCH /users/:id/status — изменить статус ACTIVE/BLOCKED */
  changeStatus: (id: string, status: UserStatus) =>
    request<Employee>({ method: "PATCH", url: `/users/${id}/status`, data: { status } }),

  /** DELETE /users/:id — мягкое удаление */
  softDelete: (id: string) =>
    request<void>({ method: "DELETE", url: `/users/${id}` }),

  /** PATCH /users/:id/note — обновить комментарий администратора */
  updateNote: (id: string, note: string) =>
    request<Employee>({ method: "PATCH", url: `/users/${id}/note`, data: { note } }),

  /** PATCH /users/:id/salary — установить оклад сотруднику (только ADMIN) */
  setSalary: (id: string, salary: number | null) =>
    request<Employee>({ method: "PATCH", url: `/users/${id}/salary`, data: { salary } }),
};
