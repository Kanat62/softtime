// Ensure a PROVIDER account exists. Idempotent — safe to run on every deploy.
//
// Runs automatically on container start (see Dockerfile CMD), and can be run
// manually:
//   DATABASE_URL=... node backend/prisma/ensure-provider.js
//
// Credentials come from env (PROVIDER_EMAIL / PROVIDER_PASSWORD / PROVIDER_NAME)
// with sensible defaults below.

'use strict';

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://softtime:softtime@localhost:5433/softtime';

const email = process.env.PROVIDER_EMAIL || 'provider@softtime.app';
const password = process.env.PROVIDER_PASSWORD || 'Provider2026!';
const fullName = process.env.PROVIDER_NAME || 'Provider Admin';

async function main() {
  const adapter = new PrismaPg({ connectionString: DB_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findFirst({ where: { email } });

    if (existing && existing.role !== 'PROVIDER') {
      console.warn(
        `[ensure-provider] Email "${email}" belongs to a ${existing.role} user — skipping.`,
      );
      return;
    }

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'PROVIDER', status: 'ACTIVE', passwordHash, deletedAt: null },
      });
      console.log(`[ensure-provider] Updated PROVIDER account: ${email}`);
    } else {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          companyId: null,
          role: 'PROVIDER',
          status: 'ACTIVE',
          fullName,
          email,
          passwordHash,
        },
      });
      console.log(`[ensure-provider] Created PROVIDER account: ${email}`);
    }
  } catch (err) {
    // Never block app startup because of seeding.
    console.error('[ensure-provider] Failed (continuing):', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
