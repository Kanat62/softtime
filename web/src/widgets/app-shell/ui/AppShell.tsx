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
  Building2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, Suspense } from "react";
import { useAuth, type UserRole } from "@/entities/session";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

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
  label: string;
  items: { to: string; label: string; icon: LucideIcon }[];
}

const ADMIN_NAV: NavGroup[] = [
  {
    label: "Главная",
    items: [{ to: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard }],
  },
  {
    label: "Управление",
    items: [
      { to: "/admin/employees", label: "Сотрудники", icon: Users },
      { to: "/admin/attendance", label: "Посещаемость", icon: ClipboardCheck },
      { to: "/admin/schedules", label: "Расписания", icon: CalendarDays },
      { to: "/admin/requests", label: "Заявки", icon: Inbox },
      { to: "/admin/news", label: "Новости", icon: Newspaper },
      { to: "/admin/reports", label: "Отчёты", icon: BarChart3 },
    ],
  },
  {
    label: "Аккаунт",
    items: [
      { to: "/admin/settings", label: "Настройки", icon: Settings },
    ],
  },
];

const PROVIDER_NAV: NavGroup[] = [
  {
    label: "Платформа",
    items: [
      { to: "/provider/dashboard", label: "Дашборд", icon: LayoutDashboard },
      { to: "/provider/companies", label: "Компании", icon: Building2 },
      { to: "/provider/payments", label: "Оплаты / Выручка", icon: Wallet },
    ],
  },
];

function Sidebar({ role }: { role: UserRole }) {
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = role === "ADMIN" ? ADMIN_NAV : PROVIDER_NAV;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-sm font-bold">ST</span>
        </div>
        <div className="text-sm font-semibold text-sidebar-foreground">SoftTime</div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
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
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>
    </aside>
  );
}

function Topbar() {
  const { user } = useAuth();
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="text-sm font-semibold text-foreground">
        {user?.role === "ADMIN" ? (user.companyName ?? "") : ""}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">{user?.fullName}</div>
          <div className="text-xs text-muted-foreground">
            {user?.role === "ADMIN" ? "Администратор" : "Provider"}
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
