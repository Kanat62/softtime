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
exports.QrController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const qr_service_1 = require("./qr.service");
const decorators_1 = require("../../common/decorators");
const regenerateSchema = zod_1.z.object({
    officeNetworkId: zod_1.z.string().uuid().nullable().optional(),
});
class RegenerateDto extends (0, nestjs_zod_1.createZodDto)(regenerateSchema) {
}
let QrController = class QrController {
    constructor(qrService) {
        this.qrService = qrService;
    }
    getActive() {
        return this.qrService.getActive();
    }
    regenerate(dto, user) {
        return this.qrService.regenerate(dto, user.userId);
    }
};
exports.QrController = QrController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить активный QR токен компании (ADMIN)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QrController.prototype, "getActive", null);
__decorate([
    (0, common_1.Post)('regenerate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Регенерировать QR: деактивировать старый, создать новый (ADMIN) + audit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegenerateDto, Object]),
    __metadata("design:returntype", void 0)
], QrController.prototype, "regenerate", null);
exports.QrController = QrController = __decorate([
    (0, swagger_1.ApiTags)('QR'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('qr'),
    (0, decorators_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [qr_service_1.QrService])
], QrController);
//# sourceMappingURL=qr.controller.js.map