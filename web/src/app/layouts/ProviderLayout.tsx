import type { ReactNode } from "react";
import { UserRole } from "@softtime/shared";
import { RoleGuard } from "@/app/router/guards";
import { AppShell } from "@/widgets/app-shell";

/**
 * Layout for all /provider/* routes.
 * Guards: must be authenticated + role === PROVIDER.
 * UI: fixed sidebar (§6.1 nav: Dashboard · Companies · Payments) + topbar + content area.
 */
export function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role={UserRole.PROVIDER}>
      <AppShell role={UserRole.PROVIDER}>{children}</AppShell>
    </RoleGuard>
  );
}
