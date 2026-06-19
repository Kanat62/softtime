import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { tenantExtension } from './prisma-tenant.extension';

// Prisma 7+: PrismaClient requires an explicit driver adapter.
// $extends() returns a NEW object — PrismaService uses composition so that
// all model delegates go through the tenant extension automatically.
const createClient = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter }).$extends(tenantExtension);
};

export type ExtendedPrismaClient = ReturnType<typeof createClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _client: ExtendedPrismaClient;

  constructor() {
    this._client = createClient();
  }

  async onModuleInit() {
    await (this._client as any).$connect();
  }

  async onModuleDestroy() {
    await (this._client as any).$disconnect();
  }

  // ─── Non-tenant models (no companyId scoping) ─────────────────────────────
  get company() { return this._client.company; }
  get subscription() { return this._client.subscription; }
  get payment() { return this._client.payment; }

  // ─── Tenant models (auto-scoped by tenantExtension) ──────────────────────
  get user() { return this._client.user; }
  get employeeSchedule() { return this._client.employeeSchedule; }
  get attendance() { return this._client.attendance; }
  get absenceRequest() { return this._client.absenceRequest; }
  get officeNetwork() { return this._client.officeNetwork; }
  get qrToken() { return this._client.qrToken; }
  get news() { return this._client.news; }
  get newsRead() { return this._client.newsRead; }
  get auditLog() { return this._client.auditLog; }
  get workSettings() { return this._client.workSettings; }
  get deviceToken() { return this._client.deviceToken; }
  get companyDefaultSchedule() { return this._client.companyDefaultSchedule; }
  get aiInsight() { return this._client.aiInsight; }

  // ─── Utilities ────────────────────────────────────────────────────────────
  get $transaction(): PrismaClient['$transaction'] {
    return (this._client as any).$transaction.bind(this._client);
  }

  get $queryRaw(): PrismaClient['$queryRaw'] {
    return (this._client as any).$queryRaw.bind(this._client);
  }

  get $executeRaw(): PrismaClient['$executeRaw'] {
    return (this._client as any).$executeRaw.bind(this._client);
  }
}
