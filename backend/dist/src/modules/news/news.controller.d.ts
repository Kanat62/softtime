import { z } from 'zod';
import { NewsService } from './news.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const FeedQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
}, z.ZodObjectDef<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
declare class FeedQueryDto extends FeedQueryDto_base {
}
declare const CreateNewsDto_base: import("nestjs-zod").ZodDto<{
    title: string;
    body: string;
    photoUrl?: string | null | undefined;
}, z.ZodObjectDef<{
    title: z.ZodString;
    body: z.ZodString;
    photoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny>, {
    title: string;
    body: string;
    photoUrl?: string | null | undefined;
}>;
declare class CreateNewsDto extends CreateNewsDto_base {
}
export declare class NewsController {
    private readonly newsService;
    constructor(newsService: NewsService);
    getFeed(query: FeedQueryDto): Promise<{
        data: {
            id: string;
            companyId: string;
            createdAt: Date;
            title: string;
            body: string;
            photoUrl: string | null;
            createdBy: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    createNews(dto: CreateNewsDto, user: TenantPayload): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        title: string;
        body: string;
        photoUrl: string | null;
        createdBy: string;
    }>;
    getReadStats(id: string): Promise<{
        stats: {
            total: number;
            readCount: number;
            unreadCount: number;
        };
        read: {
            userId: any;
            fullName: any;
            email: any;
            readAt: Date | undefined;
        }[];
        unread: {
            userId: any;
            fullName: any;
            email: any;
        }[];
    }>;
    getNews(id: string, user: TenantPayload): Promise<any>;
    markRead(id: string, user: TenantPayload): Promise<{
        ok: boolean;
    }>;
}
export {};
