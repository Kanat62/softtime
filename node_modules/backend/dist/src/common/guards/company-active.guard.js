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
exports.CompanyActiveGuard = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
let CompanyActiveGuard = class CompanyActiveGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const user = context
            .switchToHttp()
            .getRequest().user;
        if (!user?.companyId)
            return true;
        const company = await this.prisma.company.findUnique({
            where: { id: user.companyId },
            select: { status: true },
        });
        if (company?.status === shared_1.CompanyStatus.SUSPENDED) {
            throw new common_1.ForbiddenException('Subscription is not active');
        }
        return true;
    }
};
exports.CompanyActiveGuard = CompanyActiveGuard;
exports.CompanyActiveGuard = CompanyActiveGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyActiveGuard);
//# sourceMappingURL=company-active.guard.js.map