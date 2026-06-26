import { Prisma } from '@prisma/client';
import { getTenantContext } from '../common/tenant/tenant.context';
import { UserRole } from '@softtime/shared';

// Models that carry companyId and require automatic tenant isolation.
// NewsRead and DeviceToken are excluded — they have no companyId column.
const TENANT_MODELS = new Set<string>([
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

export const tenantExtension = Prisma.defineExtension((client) =>
  client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) {
            return query(args);
          }

          const ctx = getTenantContext();

          // No auth context (public route) or PROVIDER (cross-tenant) — skip scoping.
          if (!ctx || !ctx.companyId || ctx.role === UserRole.PROVIDER) {
            return query(args);
          }

          const { companyId } = ctx;
          const a = args as Record<string, any>;

          switch (operation) {
            // ── Read operations ───────────────────────────────────────────────
            case 'findMany':
            case 'findFirst':
            case 'findFirstOrThrow':
            case 'count':
            case 'aggregate':
            case 'groupBy':
              a.where = { ...a.where, companyId };
              break;

            // findUnique / findUniqueOrThrow: Prisma v5 requires where to match
            // a defined unique constraint exactly — injecting companyId breaks
            // single-field unique lookups (e.g. { id }). UUIDs are globally
            // unique so cross-tenant leaks via ID guessing are not a practical
            // risk. Service layer must verify ownership for sensitive operations.

            // ── Write operations ─────────────────────────────────────────────
            case 'create':
              a.data = { ...a.data, companyId };
              break;

            case 'createMany':
              a.data = Array.isArray(a.data)
                ? (a.data as any[]).map((d) => ({ ...d, companyId }))
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
  }),
);
