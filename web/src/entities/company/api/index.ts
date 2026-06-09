import { apiClient } from "@/shared/api/client";

export interface CompanySettings {
  companyName: string;
  timezone: string;
  defaultStartTime: string;
  defaultEndTime: string;
  autoCheckoutBuffer: number;
  companyCode: string;
}

export type UpdateSettingsDto = Omit<CompanySettings, "companyCode">;

export const companyApi = {
  getSettings: () => apiClient.get<CompanySettings>("/settings").then((r) => r.data),

  updateSettings: (dto: UpdateSettingsDto) =>
    apiClient.patch<CompanySettings>("/settings", dto).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch("/admin/password", { currentPassword, newPassword }).then((r) => r.data),
};
