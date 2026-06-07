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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma_tenant_extension_1 = require("./prisma-tenant.extension");
const createClient = () => {
    const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
    return new client_1.PrismaClient({ adapter }).$extends(prisma_tenant_extension_1.tenantExtension);
};
let PrismaService = class PrismaService {
    constructor() {
        this._client = createClient();
    }
    async onModuleInit() {
        await this._client.$connect();
    }
    async onModuleDestroy() {
        await this._client.$disconnect();
    }
    get company() { return this._client.company; }
    get subscription() { return this._client.subscription; }
    get payment() { return this._client.payment; }
    get user() { return this._client.user; }
    get employeeSchedule() { return this._client.employeeSchedule; }
    get attendance() { return this._client.attendance; }
    get absenceRequest() { return this._client.absenceRequest; }
    get officeNetwork() { return this._client.officeNetwork; }
    get qrToken() { return this._client.qrToken; }
    get news() { return this._client.news; }
    get newsRead() { return this._client.newsRead; }
    get auditLog() { return this._client.auditLog; }
    get workSettings() { return this._client.workSettings; }
    get deviceToken() { return this._client.deviceToken; }
    get $transaction() {
        return this._client.$transaction.bind(this._client);
    }
    get $queryRaw() {
        return this._client.$queryRaw.bind(this._client);
    }
    get $executeRaw() {
        return this._client.$executeRaw.bind(this._client);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map