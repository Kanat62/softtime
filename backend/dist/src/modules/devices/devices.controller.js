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
exports.DevicesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_responses_decorator_1 = require("../../common/decorators/api-responses.decorator");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const devices_service_1 = require("./devices.service");
const decorators_1 = require("../../common/decorators");
const registerDeviceSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().min(1),
    platform: zod_1.z.enum(['ios', 'android']),
});
class RegisterDeviceDto extends (0, nestjs_zod_1.createZodDto)(registerDeviceSchema) {
}
let DevicesController = class DevicesController {
    constructor(devicesService) {
        this.devicesService = devicesService;
    }
    register(dto, user) {
        return this.devicesService.register(user.userId, dto.fcmToken, dto.platform);
    }
    remove(token, user) {
        return this.devicesService.remove(user.userId, token);
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Зарегистрировать FCM токен устройства (WORKER + ADMIN + PROVIDER)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDeviceDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "register", null);
__decorate([
    (0, common_1.Delete)(':token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить FCM токен при logout (WORKER + ADMIN + PROVIDER)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "remove", null);
exports.DevicesController = DevicesController = __decorate([
    (0, swagger_1.ApiTags)('Devices'),
    (0, api_responses_decorator_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('devices'),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map