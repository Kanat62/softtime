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
exports.NewsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_responses_decorator_1 = require("../../common/decorators/api-responses.decorator");
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const news_service_1 = require("./news.service");
const decorators_1 = require("../../common/decorators");
const feedQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
const createNewsSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    body: zod_1.z.string().min(1),
    photoUrl: zod_1.z.string().url().nullable().optional(),
});
class FeedQueryDto extends (0, nestjs_zod_1.createZodDto)(feedQuerySchema) {
}
class CreateNewsDto extends (0, nestjs_zod_1.createZodDto)(createNewsSchema) {
}
let NewsController = class NewsController {
    constructor(newsService) {
        this.newsService = newsService;
    }
    getFeed(query) {
        return this.newsService.getFeed(query);
    }
    createNews(dto, user) {
        return this.newsService.createNews(dto, user.userId);
    }
    getReadStats(id) {
        return this.newsService.getReadStats(id);
    }
    getNews(id, user) {
        return this.newsService.getNews(id, user.userId);
    }
    markRead(id, user) {
        return this.newsService.markRead(id, user.userId);
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Лента новостей компании (пагинация, desc)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [FeedQueryDto]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать новость + push всем ACTIVE сотрудникам (ADMIN)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateNewsDto, Object]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "createNews", null);
__decorate([
    (0, common_1.Get)(':id/reads'),
    (0, decorators_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Статистика прочтений: кто прочитал / нет (ADMIN)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getReadStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Детали новости + авто-отметка прочтения' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getNews", null);
__decorate([
    (0, common_1.Post)(':id/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Явная отметка прочтения новости' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "markRead", null);
exports.NewsController = NewsController = __decorate([
    (0, swagger_1.ApiTags)('News'),
    (0, api_responses_decorator_1.ApiStandardErrors)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('news'),
    __metadata("design:paramtypes", [news_service_1.NewsService])
], NewsController);
//# sourceMappingURL=news.controller.js.map