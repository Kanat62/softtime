import { z } from 'zod';
import { RequestStatus, RequestType } from '@softtime/shared';
import { RequestsService } from './requests.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const CreateRequestDto_base: import("nestjs-zod").ZodDto<{
    type: RequestType;
    startDate: Date;
    endDate?: Date | null | undefined;
    desiredTime?: string | null | undefined;
    comment?: string | null | undefined;
}, z.ZodObjectDef<{
    type: z.ZodNativeEnum<typeof RequestType>;
    startDate: z.ZodDate;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    desiredTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    comment: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny>, {
    type: RequestType;
    startDate: Date;
    endDate?: Date | null | undefined;
    desiredTime?: string | null | undefined;
    comment?: string | null | undefined;
}>;
declare class CreateRequestDto extends CreateRequestDto_base {
}
declare const MyRequestsQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
    status?: RequestStatus | undefined;
}, z.ZodObjectDef<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof RequestStatus>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status?: RequestStatus | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
declare class MyRequestsQueryDto extends MyRequestsQueryDto_base {
}
declare const CompanyRequestsQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
    status?: RequestStatus | undefined;
    userId?: string | undefined;
}, z.ZodObjectDef<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof RequestStatus>>;
    userId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status?: RequestStatus | undefined;
    userId?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
declare class CompanyRequestsQueryDto extends CompanyRequestsQueryDto_base {
}
declare const RejectBodyDto_base: import("nestjs-zod").ZodDto<{
    decisionNote?: string | undefined;
}, z.ZodObjectDef<{
    decisionNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    decisionNote?: string | undefined;
}>;
declare class RejectBodyDto extends RejectBodyDto_base {
}
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    createRequest(dto: CreateRequestDto, user: TenantPayload): Promise<{
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
    getMyRequests(query: MyRequestsQueryDto, user: TenantPayload): Promise<{
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
    getCompanyRequests(query: CompanyRequestsQueryDto): Promise<{
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
    approveRequest(id: string, user: TenantPayload): Promise<{
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
    rejectRequest(id: string, body: RejectBodyDto, user: TenantPayload): Promise<{
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
}
export {};
