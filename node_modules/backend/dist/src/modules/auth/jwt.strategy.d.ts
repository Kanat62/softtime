import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: {
        sub: string;
        role: string;
        companyId: string | null;
        status?: string;
    }): TenantPayload;
}
export {};
