import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class QrService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    getActive(): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        officeNetworkId: string | null;
        token: string;
        isActive: boolean;
    }>;
    regenerate(dto: {
        officeNetworkId?: string | null;
    }, actorId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        officeNetworkId: string | null;
        token: string;
        isActive: boolean;
    }>;
}
