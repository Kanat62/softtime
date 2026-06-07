import { z } from 'zod';
import { SettingsService } from './settings.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const UpdateSettingsDto_base: import("nestjs-zod").ZodDto<{
    minWorkdayHours?: number | undefined;
    defaultCheckoutBuffer?: number | undefined;
}, z.ZodEffectsDef<z.ZodObject<{
    minWorkdayHours: z.ZodOptional<z.ZodNumber>;
    defaultCheckoutBuffer: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    minWorkdayHours?: number | undefined;
    defaultCheckoutBuffer?: number | undefined;
}, {
    minWorkdayHours?: number | undefined;
    defaultCheckoutBuffer?: number | undefined;
}>>, {
    minWorkdayHours?: number | undefined;
    defaultCheckoutBuffer?: number | undefined;
}>;
declare class UpdateSettingsDto extends UpdateSettingsDto_base {
}
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<{
        id: string;
        companyId: string;
        minWorkdayHours: number;
        defaultCheckoutBuffer: number;
    }>;
    updateSettings(dto: UpdateSettingsDto, user: TenantPayload): Promise<{
        id: string;
        companyId: string;
        minWorkdayHours: number;
        defaultCheckoutBuffer: number;
    }>;
}
export {};
