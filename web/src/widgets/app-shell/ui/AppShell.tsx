import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  Inbox,
  Newspaper,
  BarChart3,
  Settings,
  LogOut,
  Headphones,
  Building2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, Suspense } from "react";
import { useAuth, type UserRole } from "@/entities/session";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/features/language-switcher";

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      <div className="space-y-2 border-b border-border pb-5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

interface NavGroup {
  /** Ключ в nav:groups.* */
  labelKey: string;
  /** labelKey — ключ в nav:items.* */
  items: { to: string; labelKey: string; icon: LucideIcon }[];
}

const ADMIN_NAV: NavGroup[] = [
  {
    labelKey: "main",
    items: [{ to: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard }],
  },
  {
    labelKey: "manage",
    items: [
      { to: "/admin/employees", labelKey: "employees", icon: Users },
      { to: "/admin/attendance", labelKey: "attendance", icon: ClipboardCheck },
      { to: "/admin/schedules", labelKey: "schedules", icon: CalendarDays },
      { to: "/admin/requests", labelKey: "requests", icon: Inbox },
      { to: "/admin/news", labelKey: "news", icon: Newspaper },
      { to: "/admin/reports", labelKey: "reports", icon: BarChart3 },
    ],
  },
  {
    labelKey: "account",
    items: [
      { to: "/admin/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

const PROVIDER_NAV: NavGroup[] = [
  {
    labelKey: "platform",
    items: [
      { to: "/provider/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
      { to: "/provider/companies", labelKey: "companies", icon: Building2 },
      { to: "/provider/payments", labelKey: "payments", icon: Wallet },
    ],
  },
];

function Sidebar({ role }: { role: UserRole }) {
  const { t } = useTranslation("nav");
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = role === "ADMIN" ? ADMIN_NAV : PROVIDER_NAV;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md">
          <img src="/softtime-icon.png" alt="SoftTime" className="h-9 w-9 object-cover" />
        </div>
        <div className="text-sm font-semibold text-sidebar-foreground">SoftTime</div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {groups.map((group) => (
          <div key={group.labelKey} className="mb-5">
            <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`nav:groups.${group.labelKey}`)}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-base font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t(`nav:items.${item.labelKey}`)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-primary"
          onClick={() => window.open("https://wa.me/996702928197", "_blank", "noopener,noreferrer")}
        >
          <Headphones className="mr-2 h-4 w-4" />
          {t("nav:support")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("nav:logout")}
        </Button>
      </div>
    </aside>
  );
}

function Topbar() {
  const { t } = useTranslation(["enums", "common"]);
  const { user } = useAuth();
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="text-sm font-semibold text-foreground">
        {user?.role === "ADMIN" ? (user.companyName ?? "") : ""}
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">{user?.fullName}</div>
          <div className="text-xs text-muted-foreground">
            {t(`enums:userRole.${user?.role === "ADMIN" ? "ADMIN" : "PROVIDER"}`)}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {user?.fullName?.[0]?.toUpperCase() ?? "A"}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden w-full bg-background">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageFallback />}>
            <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
