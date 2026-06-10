import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Building2, DollarSign, TrendingUp, PauseCircle } from "lucide-react";
import { PageHeader, StatusBadge } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/skeleton";
import { providerApi } from "@/entities/provider/api";
import { queryKeys } from "@/shared/api/query-keys";
import { CompanyStatus } from "@softtime/shared";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

function fmtAmount(n: number) {
  return `$${n.toFixed(2)}`;
}

// ─── ProviderDashboardPage ────────────────────────────────────────────────────

export function ProviderDashboardPage() {
  const dashQ = useQuery({
    queryKey: queryKeys.providerDashboard,
    queryFn: providerApi.getDashboard,
    staleTime: 60_000,
  });

  const dash = dashQ.data;
  const loading = dashQ.isLoading;

  // Build minimal chart data from recent payments grouped by month
  const chartData = (() => {
    if (!dash) return [];
    const byMonth: Record<string, { month: string; revenue: number; count: number }> = {};
    for (const p of dash.recentPayments) {
      const key = p.createdAt.slice(0, 7); // "2026-06"
      if (!byMonth[key]) {
        byMonth[key] = {
          month: format(new Date(p.createdAt), "MMM'yy", { locale: ru }),
          revenue: 0,
          count: 0,
        };
      }
      byMonth[key].revenue += p.amountUsd;
      byMonth[key].count += 1;
    }
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  })();

  const byStatus = dash?.companies.byStatus ?? {};
  const total = dash?.companies.total ?? 0;
  const active = byStatus[CompanyStatus.ACTIVE] ?? 0;
  const trial = byStatus[CompanyStatus.TRIAL] ?? 0;
  const suspended = byStatus[CompanyStatus.SUSPENDED] ?? 0;
  const mrr = dash?.revenue.mrr ?? 0;
  const totalRevenue = dash?.revenue.total ?? 0;

  const METRICS = [
    { label: "Всего компаний", value: total, icon: Building2, color: "text-[#1877F2]", bg: "bg-[#EBF2FF]" },
    { label: "Активных", value: active, icon: TrendingUp, color: "text-[#22C55E]", bg: "bg-[#DCFCE7]" },
    { label: "На триале", value: trial, icon: Building2, color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
    { label: "Приостановлено", value: suspended, icon: PauseCircle, color: "text-[#EF4444]", bg: "bg-[#FEE2E2]" },
    { label: "MRR", value: `$${mrr}`, icon: DollarSign, color: "text-[#1877F2]", bg: "bg-[#EBF2FF]" },
    { label: "Суммарная выручка", value: `$${totalRevenue}`, icon: DollarSign, color: "text-[#22C55E]", bg: "bg-[#DCFCE7]" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд платформы" />

      {/* ── Metric cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-2xl bg-card p-5 shadow-sm">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16 rounded" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{m.value}</div>
              )}
              <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      {!loading && chartData.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="mb-1 font-semibold text-foreground">Платежи по месяцам</div>
            <div className="mb-4 text-xs text-muted-foreground">Последние поступления</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(v: number) => [v, "Платежей"]}
                />
                <Line type="monotone" dataKey="count" name="Платежей" stroke="#1877F2" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="mb-1 font-semibold text-foreground">Выручка по месяцам</div>
            <div className="mb-4 text-xs text-muted-foreground">USD</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877F2" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(v: number) => [`$${v}`, "Выручка"]}
                />
                <Area type="monotone" dataKey="revenue" name="Выручка" stroke="#1877F2" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Bottom lists ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent registrations */}
        <div className="rounded-2xl bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <div className="font-semibold text-foreground">Последние регистрации</div>
          </div>
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(dash?.recentCompanies ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{c.companyCode}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span>
                  </div>
                </div>
              ))}
              {(dash?.recentCompanies ?? []).length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Компаний пока нет</div>
              )}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="rounded-2xl bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <div className="font-semibold text-foreground">Последние платежи</div>
          </div>
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(dash?.recentPayments ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {p.subscription?.company.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-foreground">{fmtAmount(p.amountUsd)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
              {(dash?.recentPayments ?? []).length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Платежей пока нет</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
