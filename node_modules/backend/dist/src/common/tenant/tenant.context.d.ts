import { AsyncLocalStorage } from 'async_hooks';
export interface TenantPayload {
    userId: string;
    role: string;
    companyId: string | null;
    status?: string;
}
export declare const tenantStorage: AsyncLocalStorage<TenantPayload>;
export declare function getTenantContext(): TenantPayload | undefined;
