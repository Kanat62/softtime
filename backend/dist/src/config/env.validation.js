"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    JWT_ACCESS_EXPIRES: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES: zod_1.z.string().default('30d'),
    FCM_PROJECT_ID: zod_1.z.string().optional(),
    FCM_CLIENT_EMAIL: zod_1.z.string().optional(),
    FCM_PRIVATE_KEY: zod_1.z.string().optional(),
    GRACE_PERIOD_DAYS: zod_1.z.coerce.number().int().positive().default(7),
    BRUTE_FORCE_MAX_ATTEMPTS: zod_1.z.coerce.number().int().positive().default(5),
    BRUTE_FORCE_BLOCK_MINUTES: zod_1.z.coerce.number().int().positive().default(15),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
});
function validateEnv(config) {
    const result = envSchema.safeParse(config);
    if (!result.success) {
        const formatted = result.error.issues
            .map((i) => `  ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid environment variables:\n${formatted}`);
    }
    return result.data;
}
//# sourceMappingURL=env.validation.js.map