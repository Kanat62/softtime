import { RequestStatus, RequestType } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class RequestsService {
    private readonly prisma;
    private readonly audit;
    private readonly notifications;
    constructor(prisma: PrismaService, audit: AuditService, notifications: NotificationsService);
    createRequest(dto: {
        type: RequestType;
        startDate: Date;
        endDate?: Date | null;
        desiredTime?: string | null;
        comment?: string | null;
    }, userId: string, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.RequestType;
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        userId: string;
        startDate: Date;
        endDate: Date | null;
        desiredTime: string | null;
        comment: string | null;
        decidedBy: string | null;
        decisionNote: string | null;
    }>;
    getMyRequests(userId: string, query: {
        status?: RequestStatus;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            type: import(".prisma/client").$Enums.RequestType;
            status: import(".prisma/client").$Enums.RequestStatus;
            id: string;
            companyId: string;
            createdAt: Date;
            userId: string;
            startDate: Date;
            endDate: Date | null;
            desiredTime: string | null;
            comment: string | null;
            decidedBy: string | null;
            decisionNote: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getCompanyRequests(query: {
        status?: RequestStatus;
        userId?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            type: import(".prisma/client").$Enums.RequestType;
            status: import(".prisma/client").$Enums.RequestStatus;
            id: string;
            companyId: string;
            createdAt: Date;
            userId: string;
            startDate: Date;
            endDate: Date | null;
            desiredTime: string | null;
            comment: string | null;
            decidedBy: string | null;
            decisionNote: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    approveRequest(id: string, actorId: string): Promise<{
        type: import(".prisma/client").$Enums.RequestType;
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        userId: string;
        startDate: Date;
        endDate: Date | null;
        desiredTime: string | null;
        comment: string | null;
        decidedBy: string | null;
        decisionNote: string | null;
    }>;
    rejectRequest(id: string, actorId: string, decisionNote?: string): Promise<{
        type: import(".prisma/client").$Enums.RequestType;
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        userId: string;
        startDate: Date;
        endDate: Date | null;
        desiredTime: string | null;
        comment: string | null;
        decidedBy: string | null;
        decisionNote: string | null;
    }>;
    private markApprovedAbsenceDays;
}
