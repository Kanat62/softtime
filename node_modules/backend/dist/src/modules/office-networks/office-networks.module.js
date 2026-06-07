"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeNetworksModule = void 0;
const common_1 = require("@nestjs/common");
const office_networks_controller_1 = require("./office-networks.controller");
const office_networks_service_1 = require("./office-networks.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
let OfficeNetworksModule = class OfficeNetworksModule {
};
exports.OfficeNetworksModule = OfficeNetworksModule;
exports.OfficeNetworksModule = OfficeNetworksModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
        controllers: [office_networks_controller_1.OfficeNetworksController],
        providers: [office_networks_service_1.OfficeNetworksService],
        exports: [office_networks_service_1.OfficeNetworksService],
    })
], OfficeNetworksModule);
//# sourceMappingURL=office-networks.module.js.map