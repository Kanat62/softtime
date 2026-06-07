import { z } from 'zod';
import { QrService } from './qr.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const RegenerateDto_base: import("nestjs-zod").ZodDto<{
    officeNetworkId?: string | null | undefined;
}, z.ZodObjectDef<{
    officeNetworkId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny>, {
    officeNetworkId?: string | null | undefined;
}>;
declare class RegenerateDto extends RegenerateDto_base {
}
export declare class QrController {
    private readonly qrService;
    constructor(qrService: QrService);
    getActive(): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        officeNetworkId: string | null;
        token: string;
        isActive: boolean;
    }>;
    regenerate(dto: RegenerateDto, user: TenantPayload): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        officeNetworkId: string | null;
        token: string;
        isActive: boolean;
    }>;
}
export {};
