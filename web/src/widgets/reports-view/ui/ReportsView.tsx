import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RotateCcw, BarChart2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "@/shared/api/client";
import { userApi } from "@/entities/user/api";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

interface ReportRow {
  userId: string;
  fullName: string;
  workedHours: number;
  lateCount: number;
  absentCount: number;
  approvedAbsenceCount: number;
  punctualityPercent: number;
}

function getDefaultDates() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

function exportCsv(rows: ReportRow[]) {
  const header = "Сотрудник,Часов,Опозданий,Отсутствий,Согл. отсутствий,Пунктуальность %";
  const lines = rows.map(
    (r) =>
      `"${r.fullName}",${r.workedHours},${r.lateCount},${r.absentCount},${r.approvedAbsenceCount},${r.punctualityPercent}`,
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportXlsx(rows: ReportRow[], period: string) {
  const data = rows.map((r) => ({
    Сотрудник: r.fullName,
    "Часов отработано": r.workedHours,
    Опозданий: r.lateCount,
    Отсутствий: r.absentCount,
    "Согл. отсутствий": r.approvedAbsenceCount,
    "Пунктуальность %": r.punctualityPercent,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
  XLSX.writeFile(wb, `report_${period}.xlsx`);
}

export function ReportsView() {
  const defaults = getDefaultDates();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [userId, setUserId] = useState("");

  const empQuery = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 100 }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const reportQuery = useQuery({
    queryKey: queryKeys.reports({ dateFrom, dateTo, userId }),
    queryFn: () =>
      apiClient
        .get<ReportRow[]>("/reports", { params: { dateFrom, dateTo, userId: userId || undefined } })
        .then((r) => r.data),
  });

  const rows = (reportQuery.data ?? []).filter((r) => !userId || r.userId === userId);

  function handleReset() {
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
    setUserId("");
  }

  const summaryStats = {
    totalHours: rows.reduce((s, r) => s + r.workedHours, 0).toFixed(1),
    totalLate: rows.reduce((s, r) => s + r.lateCount, 0),
    totalAbsent: rows.reduce((s, r) => s + r.absentCount, 0),
    avgPunctuality: rows.length
      ? Math.round(rows.reduce((s, r) => s + r.punctualityPercent, 0) / rows.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Отчёты"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length === 0}
              onClick={() => exportCsv(rows)}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
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
          <Label className="text-xs">С даты</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">По дату</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Сотрудник</Label>
          <Select value={userId || "_all"} onValueChange={(v) => setUserId(v === "_all" ? "" : v)}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder="Все сотрудники" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Все сотрудники</SelectItem>
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
          Сбросить
        </Button>
      </div>

      {/* ── Summary metrics ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: "Часов отработано", value: summaryStats.totalHours },
          { label: "Опозданий", value: summaryStats.totalLate },
          { label: "Отсутствий", value: summaryStats.totalAbsent },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {reportQuery.isLoading ? <Skeleton className="h-7 w-16 rounded" /> : s.value}
            </div>
          </div>
        ))}
      </div>


      {/* ── Detail table ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Детальный отчёт</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {[
                "Сотрудник",
                "Часов",
                "Опозданий",
                "Отсутствий",
                "Согл. отсутствий",
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
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-16 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16">
                  <EmptyState
                    icon={<BarChart2 className="h-10 w-10" />}
                    title="Нет данных"
                    description="По выбранным фильтрам данных не найдено."
                  />
                </td>
              </tr>
            ) : (
              rows
                .slice()
                .sort((a, b) => b.workedHours - a.workedHours)
                .map((r) => (
                  <tr
                    key={r.userId}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{r.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.workedHours} ч</td>
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
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
