"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const nestjs_zod_1 = require("nestjs-zod");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let details;
        if (exception instanceof nestjs_zod_1.ZodValidationException) {
            statusCode = common_1.HttpStatus.BAD_REQUEST;
            error = 'Bad Request';
            message = 'Validation failed';
            details = exception.getZodError().errors;
        }
        else if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'string') {
                message = body;
            }
            else if (typeof body === 'object' && body !== null) {
                const b = body;
                if (typeof b.message === 'string')
                    message = b.message;
                if (typeof b.error === 'string')
                    error = b.error;
                if (b.details !== undefined)
                    details = b.details;
            }
            error = error !== 'Internal Server Error' ? error : statusCodeText(statusCode);
        }
        else {
            this.logger.error(exception);
        }
        const payload = { statusCode, message, error };
        if (details !== undefined)
            payload.details = details;
        if (typeof response.code === 'function') {
            response.code(statusCode).send(payload);
        }
        else {
            response.status(statusCode).json(payload);
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
function statusCodeText(status) {
    const map = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        409: 'Conflict',
        422: 'Unprocessable Entity',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
    };
    return map[status] ?? 'Error';
}
//# sourceMappingURL=http-exception.filter.js.map