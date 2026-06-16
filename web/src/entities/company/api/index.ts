import { apiClient } from "@/shared/api/client";
import type { CompanyRequisites } from "@softtime/shared";

export interface CompanySettings {
  id: string;
  companyId: string;
  minWorkdayHours: number;
  defaultCheckoutBuffer: number;
}

export interface UpdateSettingsDto {
  minWorkdayHours?: number;
  defaultCheckoutBuffer?: number;
}

export const companyApi = {
  getSettings: () => apiClient.get<CompanySettings>("/settings").then((r) => r.data),

  updateSettings: (dto: UpdateSettingsDto) =>
    apiClient.patch<CompanySettings>("/settings", dto).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch("/profile", { currentPassword, newPassword }).then((r) => r.data),

  getRequisites: () =>
    apiClient.get<CompanyRequisites>("/companies/me/requisites").then((r) => r.data),

  updateRequisites: (dto: CompanyRequisites) =>
    apiClient.patch<CompanyRequisites>("/companies/me/requisites", dto).then((r) => r.data),
};
