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
exports.QrService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let QrService = class QrService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getActive() {
        const qr = await this.prisma.qrToken.findFirst({
            where: { isActive: true },
        });
        if (!qr)
            throw new common_1.NotFoundException('Активный QR не найден. Используйте /qr/regenerate.');
        return qr;
    }
    async regenerate(dto, actorId) {
        await this.prisma.qrToken.deleteMany({
            where: {},
        });
        const token = crypto.randomBytes(32).toString('hex');
        const qr = await this.prisma.qrToken.create({
            data: {
                token,
                isActive: true,
                officeNetworkId: dto.officeNetworkId ?? null,
            },
        });
        await this.audit.log({
            actorId,
            action: 'QR_REGENERATED',
            entityType: 'QrToken',
            entityId: qr.id,
            meta: { officeNetworkId: dto.officeNetworkId ?? null },
        });
        return qr;
    }
};
exports.QrService = QrService;
exports.QrService = QrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], QrService);
//# sourceMappingURL=qr.service.js.map