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
exports.OfficeNetworksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let OfficeNetworksService = class OfficeNetworksService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async list() {
        return this.prisma.officeNetwork.findMany({
            where: {},
            orderBy: { label: 'asc' },
        });
    }
    async create(dto, actorId) {
        const network = await this.prisma.officeNetwork.create({
            data: { label: dto.label, cidr: dto.cidr },
        });
        await this.audit.log({
            actorId,
            action: 'OFFICE_NETWORK_CREATED',
            entityType: 'OfficeNetwork',
            entityId: network.id,
            meta: { label: dto.label, cidr: dto.cidr },
        });
        return network;
    }
    async update(id, dto, actorId) {
        const existing = await this.prisma.officeNetwork.findFirst({
            where: { id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Сеть не найдена');
        const updated = await this.prisma.officeNetwork.update({
            where: { id },
            data: dto,
        });
        await this.audit.log({
            actorId,
            action: 'OFFICE_NETWORK_UPDATED',
            entityType: 'OfficeNetwork',
            entityId: id,
            meta: dto,
        });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.prisma.officeNetwork.findFirst({
            where: { id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Сеть не найдена');
        await this.prisma.officeNetwork.delete({ where: { id } });
        await this.audit.log({
            actorId,
            action: 'OFFICE_NETWORK_DELETED',
            entityType: 'OfficeNetwork',
            entityId: id,
            meta: { label: existing.label, cidr: existing.cidr },
        });
        return { ok: true };
    }
};
exports.OfficeNetworksService = OfficeNetworksService;
exports.OfficeNetworksService = OfficeNetworksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], OfficeNetworksService);
//# sourceMappingURL=office-networks.service.js.map