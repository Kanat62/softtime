// Create (or reset) the PROVIDER account.
//
// Deletes any existing PROVIDER users, then creates a fresh one.
//
// Usage:
//   DATABASE_URL=... node backend/prisma/create-provider.js [email] [password] ["Full Name"]
//
// Defaults: provider@softtime.app / Provider2026! / "Provider Admin"

'use strict';

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://softtime:softtime@localhost:5433/softtime';

const email = process.argv[2] || 'provider@softtime.app';
const password = process.argv[3] || 'Provider2026!';
const fullName = process.argv[4] || 'Provider Admin';

async function main() {
  const adapter = new PrismaPg({ connectionString: DB_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Remove old PROVIDER accounts (hard delete)
    const removed = await prisma.user.deleteMany({ where: { role: 'PROVIDER' } });
    if (removed.count > 0) {
      console.log(`Deleted ${removed.count} old PROVIDER account(s).`);
    }

    // 2. Guard against email collision with a non-provider user
    const clash = await prisma.user.findFirst({ where: { email } });
    if (clash) {
      console.error(
        `Email "${email}" is already used by a non-PROVIDER user (${clash.role}). ` +
          `Pass a different email as the first argument.`,
      );
      process.exit(1);
    }

    // 3. Create the new PROVIDER
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        companyId: null,
        role: 'PROVIDER',
        status: 'ACTIVE',
        fullName,
        email,
        passwordHash,
      },
      select: { id: true, email: true, role: true, status: true },
    });

    console.log('\n  PROVIDER account ready:');
    console.log('  ----------------------------------------');
    console.log('  Email:    ', email);
    console.log('  Password: ', password);
    console.log('  ----------------------------------------');
    console.log('  (id:', user.id + ')\n');
  } catch (err) {
    console.error('Failed:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
