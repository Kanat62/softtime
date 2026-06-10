import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Clock, Inbox } from "lucide-react";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { UserStatus, RequestStatus } from "@softtime/shared";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Skeleton } from "@/shared/ui";
import { queryKeys } from "@/shared/api/query-keys";
import { attendanceApi } from "@/entities/attendance/api";
import { userApi } from "@/entities/user/api";
import { requestApi } from "@/entities/request/api";

// ─── MetricCard ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-9 w-16" />
      ) : (
        <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
      )}
    </div>
  );
}

// ─── WeeklyChart ─────────────────────────────────────────────────────────────

function WeeklyChart() {
  const today = new Date();
  const from = format(subDays(today, 6), "yyyy-MM-dd");
  const to = format(today, "yyyy-MM-dd");

  const weekQuery = useQuery({
    queryKey: ["attendance-week", from, to],
    queryFn: () => attendanceApi.list({ page: 1, limit: 200, from, to }),
    staleTime: 5 * 60_000,
  });

  const chartData = (() => {
    const records = weekQuery.data?.data ?? [];
    const days: { date: string; label: string; present: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = format(d, "EEE", { locale: ru });
      const present = records.filter(
        (r) => r.date === dateStr && r.checkInAt !== null,
      ).length;
      days.push({ date: dateStr, label, present });
    }
    return days;
  })();

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Посещаемость за последние 7 дней
      </h2>
      {weekQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded" />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(v: number) => [v, "Присутствовали"]}
              labelFormatter={(l) => `День: ${l}`}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="present" fill="#1877F2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── DashboardMetrics ────────────────────────────────────────────────────────

export function DashboardMetrics() {
  const totalQ = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 1 }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 1 }),
  });

  const pendingEmpQ = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 1, status: UserStatus.PENDING }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 1, status: UserStatus.PENDING }),
  });

  const inOfficeCountQ = useQuery({
    queryKey: queryKeys.inOffice,
    queryFn: attendanceApi.inOffice,
    refetchInterval: 60_000,
  });

  const pendingReqQ = useQuery({
    queryKey: queryKeys.requests({ page: 1, limit: 1, status: RequestStatus.PENDING }),
    queryFn: () => requestApi.list({ page: 1, limit: 1, status: RequestStatus.PENDING }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Сотрудников всего"
          value={totalQ.data?.meta.total ?? 0}
          icon={Users}
          loading={totalQ.isLoading}
        />
        <MetricCard
          label="Сейчас в офисе"
          value={inOfficeCountQ.data?.length ?? 0}
          icon={UserCheck}
          loading={inOfficeCountQ.isLoading}
        />
        <MetricCard
          label="Ожидают подтверждения"
          value={pendingEmpQ.data?.meta.total ?? 0}
          icon={Clock}
          loading={pendingEmpQ.isLoading}
        />
        <MetricCard
          label="Новых заявок"
          value={pendingReqQ.data?.meta.total ?? 0}
          icon={Inbox}
          loading={pendingReqQ.isLoading}
        />
      </div>
      <WeeklyChart />
    </div>
  );
}
