import { PrismaService } from '../../prisma/prisma.service';
export declare class DevicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    register(userId: string, fcmToken: string, platform: string): Promise<{
        ok: boolean;
    }>;
    remove(userId: string, fcmToken: string): Promise<{
        ok: boolean;
    }>;
}
