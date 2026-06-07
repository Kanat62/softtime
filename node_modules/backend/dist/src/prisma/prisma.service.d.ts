import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
declare const createClient: () => import("@prisma/client/runtime/client").DynamicClientExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
    result: {};
    model: {};
    query: {};
    client: {};
}, {}>, import(".prisma/client").Prisma.TypeMapCb<{
    adapter: PrismaPg;
}>, {
    result: {};
    model: {};
    query: {};
    client: {};
}>;
export type ExtendedPrismaClient = ReturnType<typeof createClient>;
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly _client;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get company(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "Company", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get subscription(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "Subscription", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get payment(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "Payment", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get user(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "User", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get employeeSchedule(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "EmployeeSchedule", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get attendance(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "Attendance", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get absenceRequest(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "AbsenceRequest", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get officeNetwork(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "OfficeNetwork", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get qrToken(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "QrToken", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get news(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "News", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get newsRead(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "NewsRead", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get auditLog(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "AuditLog", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get workSettings(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "WorkSettings", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get deviceToken(): import("@prisma/client/runtime/client").DynamicModelExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, "DeviceToken", {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
    get $transaction(): PrismaClient['$transaction'];
    get $queryRaw(): PrismaClient['$queryRaw'];
    get $executeRaw(): PrismaClient['$executeRaw'];
}
export {};
