export interface AuditLog {
  id: string;
  companyId?: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}
