import { z } from 'zod';
import { OfficeNetworksService } from './office-networks.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const CreateNetworkDto_base: import("nestjs-zod").ZodDto<{
    label: string;
    cidr: string;
}, z.ZodObjectDef<{
    label: z.ZodString;
    cidr: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    label: string;
    cidr: string;
}>;
declare class CreateNetworkDto extends CreateNetworkDto_base {
}
declare const UpdateNetworkDto_base: import("nestjs-zod").ZodDto<{
    label?: string | undefined;
    cidr?: string | undefined;
}, z.ZodEffectsDef<z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    cidr: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    label?: string | undefined;
    cidr?: string | undefined;
}, {
    label?: string | undefined;
    cidr?: string | undefined;
}>>, {
    label?: string | undefined;
    cidr?: string | undefined;
}>;
declare class UpdateNetworkDto extends UpdateNetworkDto_base {
}
export declare class OfficeNetworksController {
    private readonly officeNetworksService;
    constructor(officeNetworksService: OfficeNetworksService);
    list(): Promise<{
        id: string;
        companyId: string;
        label: string;
        cidr: string;
    }[]>;
    create(dto: CreateNetworkDto, user: TenantPayload): Promise<{
        id: string;
        companyId: string;
        label: string;
        cidr: string;
    }>;
    update(id: string, dto: UpdateNetworkDto, user: TenantPayload): Promise<{
        id: string;
        companyId: string;
        label: string;
        cidr: string;
    }>;
    remove(id: string, user: TenantPayload): Promise<{
        ok: boolean;
    }>;
}
export {};
