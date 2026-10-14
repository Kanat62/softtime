import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { dateFnsLocale } from "@/shared/lib/date-locale";
import { Download, RotateCcw, BarChart2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { reportApi } from "@/entities/report/api";
import { userApi } from "@/entities/user/api";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { ReportRow } from "@/entities/report/model/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getDefaultDates() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm", { locale: dateFnsLocale() });
  } catch {
    return "—";
  }
}

function exportXlsx(rows: ReportRow[], period: string) {
  const data = rows.map((r) => ({
    [i18n.t("reports:export.employee")]: r.fullName,
    Email: r.email,
    [i18n.t("reports:export.hours")]: r.totalWorkedHours,
    [i18n.t("reports:export.late")]: r.lateCount,
    [i18n.t("reports:export.absent")]: r.absentCount,
    [i18n.t("reports:export.approvedAbsence")]: r.approvedAbsenceCount,
    [i18n.t("reports:export.earliestCheckIn")]: fmtTime(r.earliestCheckIn),
    [i18n.t("reports:export.latestCheckOut")]: fmtTime(r.latestCheckOut),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, i18n.t("reports:export.sheetName"));
  XLSX.writeFile(wb, `report_${period}.xlsx`);
}

// ─── Chart ───────────────────────────────────────────────────────────────────

function ReportCharts({ rows, loading }: { rows: ReportRow[]; loading: boolean }) {
  const { t } = useTranslation(["reports", "common"]);
  const hoursData = rows.slice(0, 10).map((r) => ({
    name: r.fullName.split(" ")[0],
    hours: r.totalWorkedHours,
  }));
  const lateData = rows
    .filter((r) => r.lateCount > 0)
    .slice(0, 10)
    .map((r) => ({ name: r.fullName.split(" ")[0], late: r.lateCount }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (rows.length === 0) return null;

  const chartStyle = {
    contentStyle: {
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "8px",
      fontSize: "12px",
    },
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("reports:charts.hoursTop")}</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hoursData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: number) => [`${v} ${t("common:duration.hoursShort")}`, t("reports:charts.hoursTooltip")]}
              contentStyle={chartStyle.contentStyle}
            />
            <Bar dataKey="hours" fill="#1877F2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("reports:charts.lateTitle")}</h3>
        {lateData.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t("reports:charts.noLate")}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={lateData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => [v, t("reports:charts.lateTooltip")]}
                contentStyle={chartStyle.contentStyle}
              />
              <Bar dataKey="late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── ReportsView ─────────────────────────────────────────────────────────────

export function ReportsView() {
  const { t } = useTranslation(["reports", "common"]);
  const defaults = getDefaultDates();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [userId, setUserId] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  const empQuery = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 100 }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const reportQuery = useQuery({
    queryKey: queryKeys.reports({ from: dateFrom, to: dateTo, userId: userId || undefined }),
    queryFn: () =>
      reportApi.list({ from: dateFrom, to: dateTo, userId: userId || undefined }),
  });

  const rows = reportQuery.data ?? [];

  function handleReset() {
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
    setUserId("");
  }

  async function handleCsvExport() {
    setCsvLoading(true);
    try {
      await reportApi.exportCsv({
        from: dateFrom,
        to: dateTo,
        userId: userId || undefined,
      });
    } finally {
      setCsvLoading(false);
    }
  }

  const summaryStats = {
    totalHours: rows.reduce((s, r) => s + r.totalWorkedHours, 0).toFixed(1),
    totalLate: rows.reduce((s, r) => s + r.lateCount, 0),
    totalAbsent: rows.reduce((s, r) => s + r.absentCount, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reports:title")}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length === 0 || csvLoading}
              onClick={handleCsvExport}
            >
              <Download className="mr-2 h-4 w-4" />
              {csvLoading ? t("reports:downloading") : "CSV"}
            </Button>
            <Button
              size="sm"
              disabled={rows.length === 0}
              onClick={() => exportXlsx(rows, `${dateFrom}_${dateTo}`)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        }
      />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("common:fromDate")}</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("common:toDate")}</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("common:employee")}</Label>
          <Select value={userId || "_all"} onValueChange={(v) => setUserId(v === "_all" ? "" : v)}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder={t("common:allEmployees")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t("common:allEmployees")}</SelectItem>
              {(empQuery.data?.data ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 self-end text-muted-foreground"
          onClick={handleReset}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          {t("common:reset")}
        </Button>
      </div>

      {/* ── Summary metrics ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t("reports:summary.hours"), value: summaryStats.totalHours },
          { label: t("reports:summary.late"), value: summaryStats.totalLate },
          { label: t("reports:summary.absent"), value: summaryStats.totalAbsent },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {reportQuery.isLoading ? <Skeleton className="h-7 w-16 rounded" /> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <ReportCharts rows={rows} loading={reportQuery.isLoading} />

      {/* ── Detail table ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">{t("reports:detailTitle")}</h2>
        </div>
        {reportQuery.isError ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("common:loadFailedShort")}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => reportQuery.refetch()}
            >
              {t("common:retry")}
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  t("reports:columns.employee"),
                  t("reports:columns.hours"),
                  t("reports:columns.late"),
                  t("reports:columns.absent"),
                  t("reports:columns.approvedAbsence"),
                  t("reports:columns.earliestCheckIn"),
                  t("reports:columns.latestCheckOut"),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-16 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16">
                    <EmptyState
                      icon={<BarChart2 className="h-10 w-10" />}
                      title={t("common:noDataTitle")}
                      description={t("common:noDataDescription")}
                    />
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.userId}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r.fullName}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.totalWorkedHours} {t("common:duration.hoursShort")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.lateCount > 0
                            ? "font-medium text-warning-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {r.lateCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.absentCount > 0
                            ? "font-medium text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {r.absentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.approvedAbsenceCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtTime(r.earliestCheckIn)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtTime(r.latestCheckOut)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
