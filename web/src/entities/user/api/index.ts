import { UserStatus } from "@softtime/shared";
import { apiClient } from "@/shared/api/client";
import type {
  Employee,
  EmployeeDetail,
  EmployeeListParams,
  PaginatedEmployees,
} from "../model/types";

export const userApi = {
  /** GET /users?page&limit&status&search */
  listEmployees: (params: EmployeeListParams) =>
    apiClient
      .get<PaginatedEmployees>("/users", {
        params: {
          page: params.page,
          limit: params.limit,
          ...(params.status ? { status: params.status } : {}),
          ...(params.search ? { search: params.search } : {}),
        },
      })
      .then((r) => r.data),

  /** GET /users/:id */
  getEmployee: (id: string) => apiClient.get<EmployeeDetail>(`/users/${id}`).then((r) => r.data),

  /** POST /users/:id/approve — принять PENDING сотрудника */
  approveEmployee: (id: string) =>
    apiClient.post<Employee>(`/users/${id}/approve`).then((r) => r.data),

  /** POST /users/:id/reject — отклонить PENDING сотрудника (удаляет) */
  rejectEmployee: (id: string) => apiClient.post(`/users/${id}/reject`),

  /** PATCH /users/:id/status — изменить статус ACTIVE/BLOCKED */
  changeStatus: (id: string, status: UserStatus) =>
    apiClient.patch<Employee>(`/users/${id}/status`, { status }).then((r) => r.data),

  /** DELETE /users/:id — мягкое удаление */
  softDelete: (id: string) => apiClient.delete(`/users/${id}`),

  /** PATCH /users/:id/note — обновить комментарий администратора */
  updateNote: (id: string, note: string) =>
    apiClient.patch<Employee>(`/users/${id}/note`, { note }).then((r) => r.data),
};
