export interface QrToken {
  id: string;
  companyId: string;
  officeNetworkId: string | null;
  token: string;
  isActive: boolean;
  createdAt: string;
}
