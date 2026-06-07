import { UserStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class UsersService {
    private readonly prisma;
    private readonly audit;
    private readonly notifications;
    constructor(prisma: PrismaService, audit: AuditService, notifications: NotificationsService);
    listUsers(query: {
        status?: UserStatus;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            status: import(".prisma/client").$Enums.UserStatus;
            id: string;
            companyId: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string;
            avatarUrl: string | null;
            hiredAt: Date | null;
            adminNote: string | null;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getUser(id: string): Promise<{
        user: {
            status: import(".prisma/client").$Enums.UserStatus;
            id: string;
            companyId: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string;
            avatarUrl: string | null;
            hiredAt: Date | null;
            adminNote: string | null;
            createdAt: Date;
        };
        attendance: {
            status: import(".prisma/client").$Enums.DayStatus;
            id: string;
            companyId: string;
            userId: string;
            date: Date;
            checkInAt: Date | null;
            checkOutAt: Date | null;
            checkInStatus: import(".prisma/client").$Enums.CheckInStatus | null;
            checkOutStatus: import(".prisma/client").$Enums.CheckOutStatus | null;
            workedMinutes: number | null;
            isManual: boolean;
            note: string | null;
        }[];
        requests: {
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
    }>;
    approveUser(id: string, actorId: string): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        companyId: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        fullName: string;
        email: string;
        avatarUrl: string | null;
        hiredAt: Date | null;
        adminNote: string | null;
        createdAt: Date;
    }>;
    rejectUser(id: string, actorId: string): Promise<void>;
    setUserStatus(id: string, status: UserStatus, actorId: string): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        companyId: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        fullName: string;
        email: string;
        avatarUrl: string | null;
        hiredAt: Date | null;
        adminNote: string | null;
        createdAt: Date;
    }>;
    setAdminNote(id: string, note: string, actorId: string): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        companyId: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        fullName: string;
        email: string;
        avatarUrl: string | null;
        hiredAt: Date | null;
        adminNote: string | null;
        createdAt: Date;
    }>;
    deleteUser(id: string, actorId: string): Promise<void>;
    getMyProfile(userId: string): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        companyId: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        fullName: string;
        email: string;
        avatarUrl: string | null;
        hiredAt: Date | null;
        adminNote: string | null;
        createdAt: Date;
    }>;
    updateMyProfile(userId: string, dto: {
        avatarUrl?: string | null;
        currentPassword?: string;
        newPassword?: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        companyId: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        fullName: string;
        email: string;
        avatarUrl: string | null;
        hiredAt: Date | null;
        adminNote: string | null;
        createdAt: Date;
    }>;
}
