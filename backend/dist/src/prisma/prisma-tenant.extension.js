"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantExtension = void 0;
const client_1 = require("@prisma/client");
const tenant_context_1 = require("../common/tenant/tenant.context");
const shared_1 = require("@softtime/shared");
const TENANT_MODELS = new Set([
    'User',
    'EmployeeSchedule',
    'Attendance',
    'AbsenceRequest',
    'OfficeNetwork',
    'QrToken',
    'News',
    'AuditLog',
    'WorkSettings',
]);
exports.tenantExtension = client_1.Prisma.defineExtension((client) => client.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                if (!model || !TENANT_MODELS.has(model)) {
                    return query(args);
                }
                const ctx = (0, tenant_context_1.getTenantContext)();
                if (!ctx || !ctx.companyId || ctx.role === shared_1.UserRole.PROVIDER) {
                    return query(args);
                }
                const { companyId } = ctx;
                const a = args;
                switch (operation) {
                    case 'findMany':
                    case 'findFirst':
                    case 'findFirstOrThrow':
                    case 'count':
                    case 'aggregate':
                    case 'groupBy':
                        a.where = { ...a.where, companyId };
                        break;
                    case 'create':
                        a.data = { ...a.data, companyId };
                        break;
                    case 'createMany':
                        a.data = Array.isArray(a.data)
                            ? a.data.map((d) => ({ ...d, companyId }))
                            : { ...a.data, companyId };
                        break;
                    case 'upsert':
                        a.where = { ...a.where, companyId };
                        a.create = { ...a.create, companyId };
                        break;
                    case 'update':
                    case 'delete':
                    case 'updateMany':
                    case 'deleteMany':
                        a.where = { ...a.where, companyId };
                        break;
                }
                return query(args);
            },
        },
    },
}));
//# sourceMappingURL=prisma-tenant.extension.js.map