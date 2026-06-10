import type { ReactNode } from "react";
import { UserRole } from "@softtime/shared";
import { RoleGuard } from "@/app/router/guards";
import { AppShell } from "@/widgets/app-shell";

/**
 * Layout for all /admin/* routes.
 * Guards: must be authenticated + role === ADMIN.
 * UI: fixed 240px sidebar (§5.1 nav) + 64px topbar + scrollable content area (max-width 1280px).
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role={UserRole.ADMIN}>
      <AppShell role={UserRole.ADMIN}>{children}</AppShell>
    </RoleGuard>
  );
}
