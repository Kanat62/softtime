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
exports.ProfileController = exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_responses_decorator_1 = require("../../common/decorators/api-responses.decorator");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const shared_1 = require("@softtime/shared");
const users_service_1 = require("./users.service");
const decorators_1 = require("../../common/decorators");
const listUsersQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(shared_1.UserStatus).optional(),
    search: zod_1.z.string().trim().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
const setStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'BLOCKED', 'WARNING']),
});
const setNoteSchema = zod_1.z.object({
    note: zod_1.z.string().max(1000),
});
const updateProfileSchema = zod_1.z
    .object({
    avatarUrl: zod_1.z.string().url().nullable().optional(),
    currentPassword: zod_1.z.string().min(1).optional(),
    newPassword: zod_1.z.string().min(8).max(72).optional(),
})
    .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: 'currentPassword обязателен при смене пароля',
    path: ['currentPassword'],
});
class ListUsersQueryDto extends (0, nestjs_zod_1.createZodDto)(listUsersQuerySchema) {
}
class SetStatusDto extends (0, nestjs_zod_1.createZodDto)(setStatusSchema) {
}
class SetNoteDto extends (0, nestjs_zod_1.createZodDto)(setNoteSchema) {
}
class UpdateProfileDto extends (0, nestjs_zod_1.createZodDto)(updateProfileSchema) {
}
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    listUsers(query) {
        return this.usersService.listUsers(query);
    }
    getUser(id) {
        return this.usersService.getUser(id);
    }
    approveUser(id, user) {
        return this.usersService.approveUser(id, user.userId);
    }
    async rejectUser(id, user) {
        await this.usersService.rejectUser(id, user.userId);
    }
    setUserStatus(id, dto, user) {
        return this.usersService.setUserStatus(id, dto.status, user.userId);
    }
    setAdminNote(id, dto, user) {
        return this.usersService.setAdminNote(id, dto.note, user.userId);
    }
    async deleteUser(id, user) {
        await this.usersService.deleteUser(id, user.userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список сотрудников с фильтрами и пагинацией' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: shared_1.UserStatus }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListUsersQueryDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Профиль сотрудника + история посещаемости + заявки' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'PENDING → ACTIVE + push WORKER' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "approveUser", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Отклонить регистрацию PENDING + push WORKER' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "rejectUser", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Сменить статус (ACTIVE / BLOCKED / WARNING)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetStatusDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setUserStatus", null);
__decorate([
    (0, common_1.Patch)(':id/note'),
    (0, swagger_1.ApiOperation)({ summary: 'Сохранить admin-комментарий' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetNoteDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setAdminNote", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete пользователя (deletedAt)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, api_responses_decorator_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)('ADMIN'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
let ProfileController = class ProfileController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    getMyProfile(user) {
        return this.usersService.getMyProfile(user.userId);
    }
    updateMyProfile(dto, user) {
        return this.usersService.updateMyProfile(user.userId, dto);
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Свой профиль (WORKER + ADMIN)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)(),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить аватар / сменить пароль (bcrypt 12)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateProfileDto, Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateMyProfile", null);
exports.ProfileController = ProfileController = __decorate([
    (0, swagger_1.ApiTags)('Profile'),
    (0, api_responses_decorator_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('profile'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], ProfileController);
//# sourceMappingURL=users.controller.js.map