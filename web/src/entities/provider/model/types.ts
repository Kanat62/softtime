import { CompanyStatus, SubStatus, PaymentStatus, UserRole, UserStatus } from "@softtime/shared";
export type { CompanyStatus, SubStatus, PaymentStatus, UserRole, UserStatus };

export interface ProviderCompanyBrief {
  id: string;
  name: string;
  companyCode: string;
  status: CompanyStatus;
  createdAt: string;
}

export interface ProviderPaymentItem {
  id: string;
  companyId: string;
  subscriptionId: string;
  amountUsd: number;
  periodStart: string;
  periodEnd: string;
  status: PaymentStatus;
  provider: string;
  providerRef: string | null;
  createdAt: string;
  subscription: { company: { id: string; name: string } } | null;
}

export interface ProviderDashboard {
  companies: {
    total: number;
    byStatus: Partial<Record<CompanyStatus, number>>;
  };
  revenue: { mrr: number; total: number };
  recentCompanies: ProviderCompanyBrief[];
  recentPayments: ProviderPaymentItem[];
}

export interface ProviderCompanyListItem {
  id: string;
  name: string;
  companyCode: string;
  status: CompanyStatus;
  createdAt: string;
  subscription: {
    status: SubStatus;
    nextBillingAt: string | null;
    periodEnd: string;
  } | null;
  _count: { users: number };
}

export interface ProviderCompanyUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface ProviderCompanyPayment {
  id: string;
  amountUsd: number;
  periodStart: string;
  periodEnd: string;
  status: PaymentStatus;
  provider: string;
  providerRef: string | null;
  createdAt: string;
}

export interface ProviderCompanyDetail {
  id: string;
  name: string;
  companyCode: string;
  status: CompanyStatus;
  createdAt: string;
  subscription: {
    id: string;
    companyId: string;
    status: SubStatus;
    priceUsd: number;
    periodStart: string;
    periodEnd: string;
    nextBillingAt: string | null;
    payments: ProviderCompanyPayment[];
  } | null;
  users: ProviderCompanyUser[];
}

export interface ProviderPaymentsResult {
  summary: { totalAmount: number; count: number; avgAmount: number };
  data: ProviderPaymentItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}
