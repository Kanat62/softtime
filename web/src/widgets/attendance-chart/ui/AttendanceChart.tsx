import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { DayStatus } from "@softtime/shared";

import { Skeleton, ErrorState } from "@/shared/ui";
import { queryKeys } from "@/shared/api/query-keys";
import { attendanceApi } from "@/entities/attendance/api";
import type { AttendanceRow } from "@/entities/attendance/model/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function weekAgoISO() {
  return new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
}

function buildWeeklyChart(records: AttendanceRow[]) {
  const buckets: Record<string, { present: number; late: number; absent: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    buckets[d] = { present: 0, late: 0, absent: 0 };
  }
  for (const r of records) {
    if (!buckets[r.date]) continue;
    if (r.status === DayStatus.PRESENT) {
      buckets[r.date].present++;
    } else if (r.status === DayStatus.LATE) {
      buckets[r.date].late++;
    } else if (r.status === DayStatus.ABSENT || r.status === DayStatus.INCOMPLETE) {
      buckets[r.date].absent++;
    }
  }
  return Object.entries(buckets).map(([date, v]) => ({
    day: format(parseISO(date), "EEE", { locale: ru }),
    date,
    ...v,
  }));
}

// ─── AttendanceChart ──────────────────────────────────────────────────────────

export function AttendanceChart() {
  const dateFrom = weekAgoISO();
  const dateTo = todayISO();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.attendance({ dateFrom, dateTo, page: 1, limit: 200 }),
    queryFn: () => attendanceApi.list({ dateFrom, dateTo, page: 1, limit: 200 }),
  });

  const chartData = data ? buildWeeklyChart(data.data) : [];

  return (
    <div className="rounded-2xl bg-card shadow-sm p-5">
      <div className="mb-1 font-semibold text-foreground">Посещаемость за неделю</div>
      <div className="mb-4 text-xs text-muted-foreground">
        По дням — вовремя / опоздание / отсутствие
      </div>

      {isLoading && <Skeleton className="h-48 w-full rounded-xl" />}

      {isError && (
        <ErrorState message="Не удалось загрузить данные графика" onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
              labelStyle={{ color: "#111827", fontWeight: 600 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="present" name="Вовремя" fill="#22C55E" radius={[3, 3, 0, 0]} />
            <Bar dataKey="late" name="Опоздание" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            <Bar dataKey="absent" name="Отсутствие" fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
