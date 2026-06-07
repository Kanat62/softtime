"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const nestjs_zod_1 = require("nestjs-zod");
const nestjs_zod_2 = require("nestjs-zod");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const tenant_interceptor_1 = require("./common/interceptors/tenant.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: false }), { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new nestjs_zod_2.ZodValidationPipe());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new tenant_interceptor_1.TenantInterceptor());
    (0, nestjs_zod_1.patchNestJsSwagger)();
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('SoftTime API')
        .setDescription('SoftTime — мультитенантная HR SaaS платформа')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
}
bootstrap().catch((err) => {
    console.error('Bootstrap error:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map