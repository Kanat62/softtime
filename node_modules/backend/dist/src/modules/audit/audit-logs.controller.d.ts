import { z } from 'zod';
import { AuditService } from './audit.service';
declare const AuditLogsQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
    action?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}, z.ZodObjectDef<{
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
    action: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    action?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}>;
declare class AuditLogsQueryDto extends AuditLogsQueryDto_base {
}
export declare class AuditLogsController {
    private readonly auditService;
    constructor(auditService: AuditService);
    list(query: AuditLogsQueryDto): Promise<{
        data: {
            meta: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            companyId: string | null;
            createdAt: Date;
            actorId: string;
            action: string;
            entityType: string;
            entityId: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
}
export {};
