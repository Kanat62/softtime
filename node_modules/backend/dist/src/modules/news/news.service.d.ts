import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class NewsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    getFeed(query: {
        page: number;
        limit: number;
    }): Promise<{
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
    getNews(id: string, userId: string): Promise<any>;
    markRead(newsId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    createNews(dto: {
        title: string;
        body: string;
        photoUrl?: string | null;
    }, adminId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        title: string;
        body: string;
        photoUrl: string | null;
        createdBy: string;
    }>;
    getReadStats(newsId: string): Promise<{
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
}
