import { z } from 'zod';
import { DevicesService } from './devices.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const RegisterDeviceDto_base: import("nestjs-zod").ZodDto<{
    fcmToken: string;
    platform: "ios" | "android";
}, z.ZodObjectDef<{
    fcmToken: z.ZodString;
    platform: z.ZodEnum<["ios", "android"]>;
}, "strip", z.ZodTypeAny>, {
    fcmToken: string;
    platform: "ios" | "android";
}>;
declare class RegisterDeviceDto extends RegisterDeviceDto_base {
}
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    register(dto: RegisterDeviceDto, user: TenantPayload): Promise<{
        ok: boolean;
    }>;
    remove(token: string, user: TenantPayload): Promise<{
        ok: boolean;
    }>;
}
export {};
