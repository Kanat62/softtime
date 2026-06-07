"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiStandardErrors = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ApiStandardErrors = () => (0, common_1.applyDecorators)((0, swagger_1.ApiUnauthorizedResponse)({ description: 'JWT отсутствует или невалиден' }), (0, swagger_1.ApiForbiddenResponse)({ description: 'Недостаточно прав (роль / статус / SUSPENDED)' }), (0, swagger_1.ApiBadRequestResponse)({ description: 'Ошибка валидации запроса' }), (0, swagger_1.ApiUnprocessableEntityResponse)({ description: 'Нарушено бизнес-правило' }));
exports.ApiStandardErrors = ApiStandardErrors;
//# sourceMappingURL=api-responses.decorator.js.map