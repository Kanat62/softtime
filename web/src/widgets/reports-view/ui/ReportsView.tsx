import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Download, RotateCcw, BarChart2, FileSpreadsheet, AlertCircle, Settings, Brain, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
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
import { companyApi } from "@/entities/company/api";
import { apiClient } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ROUTES } from "@/shared/config/routes";
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
    return format(new Date(iso), "HH:mm", { locale: ru });
  } catch {
    return "—";
  }
}

function exportXlsx(rows: ReportRow[], period: string) {
  const data = rows.map((r) => ({
    Сотрудник: r.fullName,
    Email: r.email,
    "Часов отработано": r.totalWorkedHours,
    Опозданий: r.lateCount,
    Отсутствий: r.absentCount,
    "Согл. отсутствий": r.approvedAbsenceCount,
    "Ранний приход": fmtTime(r.earliestCheckIn),
    "Поздний уход": fmtTime(r.latestCheckOut),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
  XLSX.writeFile(wb, `report_${period}.xlsx`);
}

// ─── Chart ───────────────────────────────────────────────────────────────────

function ReportCharts({ rows, loading }: { rows: ReportRow[]; loading: boolean }) {
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
        <h3 className="mb-3 text-sm font-semibold text-foreground">Часов отработано (топ-10)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hoursData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: number) => [`${v} ч`, "Часов"]}
              contentStyle={chartStyle.contentStyle}
            />
            <Bar dataKey="hours" fill="#1877F2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Опоздания</h3>
        {lateData.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">Опозданий нет — отлично!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={lateData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => [v, "Опозданий"]}
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

// ─── STI-161 required fields ─────────────────────────────────────────────────

const REQUIRED_REQUISITES: { key: keyof ReturnType<typeof buildRequisiteLabels>; label: string }[] =
  [
    { key: "tax_id", label: "ИНН (102)" },
    { key: "tax_authority_code", label: "Код УГНС (104)" },
    { key: "social_fund_reg_number", label: "Рег. номер страх. взносов (117)" },
    { key: "okpo_code", label: "Код ОКПО (107)" },
  ];

function buildRequisiteLabels(data: Awaited<ReturnType<typeof companyApi.getRequisites>>) {
  return data;
}

const DOC_TYPES = [
  { value: "INITIAL",     label: "Первоначальный" },
  { value: "REVISED",     label: "Уточнённый" },
  { value: "LIQUIDATION", label: "Ликвидационный" },
];

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

const LOADING_MESSAGES = [
  "ИИ анализирует данные посещаемости...",
  "Формирую Раздел I — реквизиты...",
  "Заполняю данные сотрудников...",
  "Генерирую PDF...",
];

const TIMER_R = 10;
const TIMER_C = 2 * Math.PI * TIMER_R;

type GenStatus = "idle" | "loading" | "done";

function Sti161Tab() {
  const currentYear = new Date().getFullYear();
  const [docType, setDocType] = useState("INITIAL");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [status, setStatus] = useState<GenStatus>("idle");
  const [msgIndex, setMsgIndex] = useState(0);
  const [circleAnimate, setCircleAnimate] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cycle progress messages + drive the circular timer while loading.
  useEffect(() => {
    if (status !== "loading") return;
    setMsgIndex(0);
    const interval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 1200);
    // Kick off the SVG stroke-dashoffset transition on the next frame.
    setCircleAnimate(false);
    const raf = requestAnimationFrame(() => setCircleAnimate(true));
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, [status]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleGenerate() {
    setStatus("loading");
    const apiCall = apiClient.post(
      "/reports/sti161/pdf",
      { documentType: docType, periodMonth: Number(month), periodYear: Number(year) },
      { responseType: "blob" },
    );
    const wait = new Promise<void>((res) => setTimeout(res, 5000));
    try {
      const [response] = await Promise.all([apiCall, wait]);
      setStatus("done");
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `STI-161_${year}_${String(month).padStart(2, "0")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("idle");
    }
  }

  const requisitesQuery = useQuery({
    queryKey: ["company-requisites"],
    queryFn: companyApi.getRequisites,
  });

  if (requisitesQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const data = requisitesQuery.data;
  const missing = REQUIRED_REQUISITES.filter((f) => !data?.[f.key]);
  const isBlocked = missing.length > 0;

  if (isBlocked) {
    return (
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <AlertCircle className="h-6 w-6 text-warning-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              Заполните реквизиты компании, чтобы сгенерировать СТИ-161
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Не заполнены обязательные поля:
            </p>
          </div>
          <ul className="w-full max-w-xs space-y-1 text-left">
            {missing.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-sm text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {f.label}
              </li>
            ))}
          </ul>
          <Link to={ROUTES.admin.settings}>
            <Button size="sm" className="mt-2">
              <Settings className="mr-2 h-4 w-4" />
              Перейти в Настройки → Реквизиты
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-foreground">Параметры отчёта</h2>
        <p className="text-sm text-muted-foreground">
          Реквизиты компании (поля 102–118) будут подставлены автоматически.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Тип документа (001)</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Месяц (201)</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Год (202)</Label>
            <Input
              type="number"
              value={year}
              min={2020}
              max={currentYear + 1}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 pt-2">
          <Button
            onClick={handleGenerate}
            disabled={status !== "idle"}
            className={`relative min-w-60 justify-center overflow-hidden transition-colors duration-300 ${
              status === "done" ? "bg-green-600 hover:bg-green-600 disabled:opacity-100" : ""
            } ${status === "loading" ? "disabled:opacity-100" : ""}`}
          >
            {/* Shimmer overlay */}
            {status === "loading" && (
              <span className="pointer-events-none absolute inset-0 overflow-hidden">
                <span className="absolute inset-y-0 left-0 w-1/2 animate-sti-shimmer bg-linear-to-r from-transparent via-white/30 to-transparent" />
              </span>
            )}

            {status === "idle" && (
              <span className="relative z-10 flex items-center">
                <Brain className="mr-2 h-4 w-4" />
                Сформировать с ИИ
              </span>
            )}

            {status === "loading" && (
              <span className="relative z-10 flex w-full items-center justify-center">
                {/* Three bouncing dots */}
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
                {/* Circular countdown timer */}
                <span className="absolute right-0 flex items-center">
                  <svg className="h-4 w-4 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r={TIMER_R}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.25"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r={TIMER_R}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={TIMER_C}
                      strokeDashoffset={circleAnimate ? 0 : TIMER_C}
                      style={{ transition: circleAnimate ? "stroke-dashoffset 5s linear" : "none" }}
                    />
                  </svg>
                </span>
              </span>
            )}

            {status === "done" && (
              <span className="relative z-10 flex items-center">
                <Check className="mr-2 h-4 w-4" />
                СТИ-161 сформирован
                <Download className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>

          {status === "loading" && (
            <p className="text-sm text-muted-foreground">{LOADING_MESSAGES[msgIndex]}</p>
          )}
          {status === "done" && (
            <p className="text-sm text-green-600">Файл скачивается...</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ReportsView ─────────────────────────────────────────────────────────────

export function ReportsView() {
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
        title="Отчёты"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length === 0 || csvLoading}
              onClick={handleCsvExport}
            >
              <Download className="mr-2 h-4 w-4" />
              {csvLoading ? "Скачиваем..." : "CSV"}
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

      <Tabs defaultValue="attendance">
        <TabsList className="mb-2">
          <TabsTrigger value="attendance">Посещаемость</TabsTrigger>
          <TabsTrigger value="sti161">СТИ-161</TabsTrigger>
        </TabsList>
        <TabsContent value="sti161">
          <Sti161Tab />
        </TabsContent>
        <TabsContent value="attendance" className="space-y-6">

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
      <div className="grid grid-cols-3 gap-4">
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

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <ReportCharts rows={rows} loading={reportQuery.isLoading} />

      {/* ── Detail table ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Детальный отчёт</h2>
        </div>
        {reportQuery.isError ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => reportQuery.refetch()}
            >
              Повторить
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  "Сотрудник",
                  "Часов",
                  "Опозданий",
                  "Отсутствий",
                  "Согл. отсутствий",
                  "Ранний приход",
                  "Поздний уход",
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
                      title="Нет данных"
                      description="По выбранным фильтрам данных не найдено."
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
                    <td className="px-4 py-3 text-muted-foreground">{r.totalWorkedHours} ч</td>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
