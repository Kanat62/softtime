"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DevicesService = class DevicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(userId, fcmToken, platform) {
        const existing = await this.prisma.deviceToken.findFirst({
            where: { fcmToken },
        });
        if (existing) {
            if (existing.userId !== userId) {
                await this.prisma.deviceToken.update({
                    where: { id: existing.id },
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
    async remove(userId, fcmToken) {
        await this.prisma.deviceToken.deleteMany({
            where: { fcmToken, userId },
        });
        return { ok: true };
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map