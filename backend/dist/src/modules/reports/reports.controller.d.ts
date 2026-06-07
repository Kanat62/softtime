import { z } from 'zod';
import { FastifyReply } from 'fastify';
import { ReportsService } from './reports.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const ReportQueryDto_base: import("nestjs-zod").ZodDto<{
    from: Date;
    to: Date;
    userId?: string | undefined;
}, z.ZodObjectDef<{
    from: z.ZodDate;
    to: z.ZodDate;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    from: Date;
    to: Date;
    userId?: string | undefined;
}>;
declare class ReportQueryDto extends ReportQueryDto_base {
}
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    exportCsv(query: ReportQueryDto, _user: TenantPayload, res: FastifyReply): Promise<never>;
    getAttendanceReport(query: ReportQueryDto): Promise<import("./reports.service").ReportRow[]>;
}
export {};
