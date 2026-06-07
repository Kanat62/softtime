import { z } from 'zod';
import { UserStatus } from '@softtime/shared';
import { UsersService } from './users.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const ListUsersQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
    status?: UserStatus | undefined;
    search?: string | undefined;
}, z.ZodObjectDef<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof UserStatus>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status?: UserStatus | undefined;
    search?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
declare class ListUsersQueryDto extends ListUsersQueryDto_base {
}
declare const SetStatusDto_base: import("nestjs-zod").ZodDto<{
    status: "ACTIVE" | "WARNING" | "BLOCKED";
}, z.ZodObjectDef<{
    status: z.ZodEnum<["ACTIVE", "BLOCKED", "WARNING"]>;
}, "strip", z.ZodTypeAny>, {
    status: "ACTIVE" | "WARNING" | "BLOCKED";
}>;
declare class SetStatusDto extends SetStatusDto_base {
}
declare const SetNoteDto_base: import("nestjs-zod").ZodDto<{
    note: string;
}, z.ZodObjectDef<{
    note: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    note: string;
}>;
declare class SetNoteDto extends SetNoteDto_base {
}
declare const UpdateProfileDto_base: import("nestjs-zod").ZodDto<{
    avatarUrl?: string | null | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
}, z.ZodEffectsDef<z.ZodObject<{
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currentPassword: z.ZodOptional<z.ZodString>;
    newPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    avatarUrl?: string | null | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
}, {
    avatarUrl?: string | null | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
}>>, {
    avatarUrl?: string | null | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
}>;
declare class UpdateProfileDto extends UpdateProfileDto_base {
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    listUsers(query: ListUsersQueryDto): Promise<{
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
    approveUser(id: string, user: TenantPayload): Promise<{
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
    rejectUser(id: string, user: TenantPayload): Promise<void>;
    setUserStatus(id: string, dto: SetStatusDto, user: TenantPayload): Promise<{
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
    setAdminNote(id: string, dto: SetNoteDto, user: TenantPayload): Promise<{
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
    deleteUser(id: string, user: TenantPayload): Promise<void>;
}
export declare class ProfileController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(user: TenantPayload): Promise<{
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
    updateMyProfile(dto: UpdateProfileDto, user: TenantPayload): Promise<{
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
export {};
