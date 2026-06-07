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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CompaniesService = class CompaniesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyCompany(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            include: { subscription: true },
        });
        if (!company)
            throw new common_1.NotFoundException('Компания не найдена');
        return {
            id: company.id,
            name: company.name,
            companyCode: company.companyCode,
            status: company.status,
            createdAt: company.createdAt,
            subscription: company.subscription
                ? {
                    status: company.subscription.status,
                    priceUsd: company.subscription.priceUsd,
                    periodStart: company.subscription.periodStart,
                    periodEnd: company.subscription.periodEnd,
                    nextBillingAt: company.subscription.nextBillingAt,
                }
                : null,
        };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map