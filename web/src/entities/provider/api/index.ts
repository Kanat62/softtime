import { apiClient } from "@/shared/api/client";
import type {
  ProviderDashboard,
  ProviderCompanyListItem,
  ProviderCompanyDetail,
  ProviderPaymentsResult,
  CompanyStatus,
  SubStatus,
  PaymentStatus,
} from "../model/types";

export interface ProviderCompaniesParams {
  status?: CompanyStatus;
  subscriptionStatus?: SubStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProviderPaymentsParams {
  from?: string;
  to?: string;
  companyId?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedProviderCompanies {
  data: ProviderCompanyListItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export const providerApi = {
  getDashboard: () =>
    apiClient.get<ProviderDashboard>("/provider/dashboard").then((r) => r.data),

  listCompanies: (params?: ProviderCompaniesParams) =>
    apiClient
      .get<PaginatedProviderCompanies>("/provider/companies", { params })
      .then((r) => r.data),

  getCompany: (id: string) =>
    apiClient.get<ProviderCompanyDetail>(`/provider/companies/${id}`).then((r) => r.data),

  activateCompany: (id: string) =>
    apiClient.patch<{ ok: boolean }>(`/provider/companies/${id}/activate`).then((r) => r.data),

  suspendCompany: (id: string) =>
    apiClient.patch<{ ok: boolean }>(`/provider/companies/${id}/suspend`).then((r) => r.data),

  listPayments: (params?: ProviderPaymentsParams) =>
    apiClient
      .get<ProviderPaymentsResult>("/provider/payments", { params })
      .then((r) => r.data),
};
