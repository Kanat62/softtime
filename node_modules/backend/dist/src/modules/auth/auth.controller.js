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
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../common/decorators");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const shared_1 = require("@softtime/shared");
const auth_service_1 = require("./auth.service");
const decorators_2 = require("../../common/decorators");
const decorators_3 = require("../../common/decorators");
class RegisterCompanyDto extends (0, nestjs_zod_1.createZodDto)(shared_1.registerCompanySchema) {
}
class RegisterWorkerDto extends (0, nestjs_zod_1.createZodDto)(shared_1.registerWorkerSchema) {
}
class LoginDto extends (0, nestjs_zod_1.createZodDto)(shared_1.loginSchema) {
}
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'refreshToken обязателен'),
});
class RefreshDto extends (0, nestjs_zod_1.createZodDto)(refreshSchema) {
}
const logoutSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().optional(),
});
class LogoutDto extends (0, nestjs_zod_1.createZodDto)(logoutSchema) {
}
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    registerCompany(dto) {
        return this.authService.registerCompany(dto);
    }
    registerWorker(dto) {
        return this.authService.registerWorker(dto);
    }
    login(dto, req) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
            req.ip ??
            '0.0.0.0';
        return this.authService.login(dto, ip);
    }
    refresh(dto) {
        return this.authService.refresh(dto.refreshToken);
    }
    async logout(user, dto) {
        await this.authService.logout(user.userId, dto.fcmToken);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_2.Public)(),
    (0, common_1.Post)('register/company'),
    (0, swagger_1.ApiOperation)({ summary: 'Регистрация ADMIN + компании' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterCompanyDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerCompany", null);
__decorate([
    (0, decorators_2.Public)(),
    (0, common_1.Post)('register/worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Регистрация WORKER по коду компании' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterWorkerDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerWorker", null);
__decorate([
    (0, decorators_2.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Вход (email + пароль)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, decorators_2.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить токены по refresh-токену' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Инвалидация refresh-токена и FCM' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, decorators_3.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, LogoutDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, decorators_1.ApiStandardErrors)(),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map