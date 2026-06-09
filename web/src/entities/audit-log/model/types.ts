export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  target?: string;
  createdAt: string;
}
