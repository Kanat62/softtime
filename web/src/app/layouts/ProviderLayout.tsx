import type { ReactNode } from "react";
import { RoleGuard } from "@/app/router/guards";
import { AppShell } from "@/widgets/app-shell";

/**
 * Layout for all /provider/* routes.
 * Guards: must be authenticated + role === PROVIDER.
 * UI: fixed sidebar (§6.1 nav: Dashboard · Companies · Payments) + topbar + content area.
 */
export function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="PROVIDER">
      <AppShell role="PROVIDER">{children}</AppShell>
    </RoleGuard>
  );
}
