import { AsyncLocalStorage } from 'async_hooks';

export interface TenantPayload {
  userId: string;
  role: string;
  companyId: string | null;
  /** UserStatus value — injected by JwtStrategy.validate() into req.user */
  status?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantPayload>();

export function getTenantContext(): TenantPayload | undefined {
  return tenantStorage.getStore();
}
