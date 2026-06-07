import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, fcmToken: string, platform: string) {
    // Token already registered — re-assign to current user if it belongs to another
    const existing = await this.prisma.deviceToken.findFirst({
      where: { fcmToken },
    });

    if (existing) {
      if ((existing as any).userId !== userId) {
        await this.prisma.deviceToken.update({
          where: { id: (existing as any).id },
          data: { userId },
        });
      }
      return { ok: true };
    }

    await this.prisma.deviceToken.create({
      data: { userId, fcmToken, platform },
    });
    return { ok: true };
  }

  async remove(userId: string, fcmToken: string) {
    // deleteMany is safe even if the token doesn't exist (returns count 0, no error)
    await this.prisma.deviceToken.deleteMany({
      where: { fcmToken, userId },
    });
    return { ok: true };
  }
}
