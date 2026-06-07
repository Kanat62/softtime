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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeNetworksController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const office_networks_service_1 = require("./office-networks.service");
const decorators_1 = require("../../common/decorators");
const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const createNetworkSchema = zod_1.z.object({
    label: zod_1.z.string().min(1).max(100),
    cidr: zod_1.z.string().regex(cidrPattern, 'Некорректный CIDR или IP (пример: 192.168.1.0/24)'),
});
const updateNetworkSchema = zod_1.z.object({
    label: zod_1.z.string().min(1).max(100).optional(),
    cidr: zod_1.z.string().regex(cidrPattern, 'Некорректный CIDR или IP (пример: 192.168.1.0/24)').optional(),
}).refine((d) => d.label !== undefined || d.cidr !== undefined, {
    message: 'Укажите хотя бы одно поле для обновления',
});
class CreateNetworkDto extends (0, nestjs_zod_1.createZodDto)(createNetworkSchema) {
}
class UpdateNetworkDto extends (0, nestjs_zod_1.createZodDto)(updateNetworkSchema) {
}
let OfficeNetworksController = class OfficeNetworksController {
    constructor(officeNetworksService) {
        this.officeNetworksService = officeNetworksService;
    }
    list() {
        return this.officeNetworksService.list();
    }
    create(dto, user) {
        return this.officeNetworksService.create(dto, user.userId);
    }
    update(id, dto, user) {
        return this.officeNetworksService.update(id, dto, user.userId);
    }
    remove(id, user) {
        return this.officeNetworksService.remove(id, user.userId);
    }
};
exports.OfficeNetworksController = OfficeNetworksController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список офисных сетей компании (ADMIN)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OfficeNetworksController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Добавить офисную сеть (ADMIN) + audit' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateNetworkDto, Object]),
    __metadata("design:returntype", void 0)
], OfficeNetworksController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить label или cidr сети (ADMIN) + audit' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateNetworkDto, Object]),
    __metadata("design:returntype", void 0)
], OfficeNetworksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить офисную сеть (физическое удаление, ADMIN) + audit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OfficeNetworksController.prototype, "remove", null);
exports.OfficeNetworksController = OfficeNetworksController = __decorate([
    (0, swagger_1.ApiTags)('Office Networks'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('office-networks'),
    (0, decorators_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [office_networks_service_1.OfficeNetworksService])
], OfficeNetworksController);
//# sourceMappingURL=office-networks.controller.js.map