import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class OfficeNetworksService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    list(): Promise<{
        id: string;
        companyId: string;
        label: string;
        cidr: string;
    }[]>;
    create(dto: {
        label: string;
        cidr: string;
    }, actorId: string): Promise<{
        id: string;
        companyId: string;
        label: string;
        cidr: string;
    }>;
    update(id: string, dto: {
        label?: string;
        cidr?: string;
    }, actorId: string): Promise<{
        id: string;
        companyId: string;
        label: string;
        cidr: string;
    }>;
    remove(id: string, actorId: string): Promise<{
        ok: boolean;
    }>;
}
