import { UserRole, UserStatus } from '@softtime/shared';
import type { User } from '@softtime/shared';

const TAX_DEFAULTS = {
  inn: null,
  citizenship: null,
  isResident: true,
  salary: null,
} as const;

export const mockWorker: User = {
  id: 'user-worker-001',
  companyId: 'company-001',
  role: UserRole.WORKER,
  status: UserStatus.ACTIVE,
  fullName: 'Иван Петров',
  email: 'ivan.petrov@example.com',
  avatarUrl: null,
  hiredAt: new Date('2024-03-01'),
  adminNote: null,
  deletedAt: null,
  createdAt: new Date('2024-03-01'),
  ...TAX_DEFAULTS,
};

export const mockAdmin: User = {
  id: 'user-admin-001',
  companyId: 'company-001',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  fullName: 'Анна Смирнова',
  email: 'anna.smirnova@example.com',
  avatarUrl: null,
  hiredAt: new Date('2023-01-15'),
  adminNote: null,
  deletedAt: null,
  createdAt: new Date('2023-01-15'),
  ...TAX_DEFAULTS,
};

export const mockWorkers: User[] = [
  mockWorker,
  {
    id: 'user-worker-002',
    companyId: 'company-001',
    role: UserRole.WORKER,
    status: UserStatus.ACTIVE,
    fullName: 'Алексей Козлов',
    email: 'alexey.kozlov@example.com',
    avatarUrl: null,
    hiredAt: new Date('2024-06-01'),
    adminNote: null,
    deletedAt: null,
    createdAt: new Date('2024-06-01'),
    ...TAX_DEFAULTS,
  },
  {
    id: 'user-worker-003',
    companyId: 'company-001',
    role: UserRole.WORKER,
    status: UserStatus.PENDING,
    fullName: 'Мария Иванова',
    email: 'maria.ivanova@example.com',
    avatarUrl: null,
    hiredAt: null,
    adminNote: null,
    deletedAt: null,
    createdAt: new Date('2026-06-01'),
    ...TAX_DEFAULTS,
  },
  {
    id: 'user-worker-004',
    companyId: 'company-001',
    role: UserRole.WORKER,
    status: UserStatus.PENDING,
    fullName: 'Дмитрий Орлов',
    email: 'dmitry.orlov@example.com',
    avatarUrl: null,
    hiredAt: null,
    adminNote: null,
    deletedAt: null,
    createdAt: new Date('2026-06-05'),
    ...TAX_DEFAULTS,
  },
];
