import { applyDecorators } from '@nestjs/common';
import {
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

export const ApiStandardErrors = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'JWT отсутствует или невалиден' }),
    ApiForbiddenResponse({ description: 'Недостаточно прав (роль / статус / SUSPENDED)' }),
    ApiBadRequestResponse({ description: 'Ошибка валидации запроса' }),
    ApiUnprocessableEntityResponse({ description: 'Нарушено бизнес-правило' }),
  );
