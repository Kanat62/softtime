export interface QrToken {
  id: string;
  code: string;
  location: string;
  networkId?: string | null;
  updatedAt: string;
}
