import { PrismaService } from '../../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(params: {
        actorId: string;
        action: string;
        entityType: string;
        entityId?: string;
        meta?: Record<string, unknown>;
        companyId?: string;
    }): Promise<void>;
    list(query: {
        from?: Date;
        to?: Date;
        action?: string;
        page: number;
        limit: number;
    }): Promise<{
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
