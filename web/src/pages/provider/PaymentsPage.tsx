import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { PaymentStatus } from "@softtime/shared";
import { PageHeader, StatusBadge, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { providerApi } from "@/entities/provider/api";
import type { ProviderPaymentsParams } from "@/entities/provider/api";
import { queryKeys } from "@/shared/api/query-keys";
import type { ProviderPaymentItem } from "@/entities/provider/model/types";

const PAGE_SIZE = 30;

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

function fmtPeriod(start: string, end: string) {
  try {
    return `${format(new Date(start), "MM.yyyy")}–${format(new Date(end), "MM.yyyy")}`;
  } catch {
    return `${start}–${end}`;
  }
}

function periodCutoff(value: string): string | undefined {
  if (value === "all") return undefined;
  const days = Number(value);
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function exportCSV(rows: ProviderPaymentItem[]) {
  const header = ["Дата", "Компания", "Сумма", "Период", "Провайдер", "Референс", "Статус"];
  const lines = rows.map((r) =>
    [
      fmtDate(r.createdAt),
      r.subscription?.company.name ?? "",
      `$${r.amountUsd.toFixed(2)}`,
      fmtPeriod(r.periodStart, r.periodEnd),
      r.provider,
      r.providerRef ?? "",
      r.status,
    ].join(";"),
  );
  const csv = [header.join(";"), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: ProviderPaymentItem[]) {
  const header = "Дата\tКомпания\tСумма\tПериод\tПровайдер\tРеференс\tСтатус";
  const lines = rows.map((r) =>
    [
      fmtDate(r.createdAt),
      r.subscription?.company.name ?? "",
      `$${r.amountUsd.toFixed(2)}`,
      fmtPeriod(r.periodStart, r.periodEnd),
      r.provider,
      r.providerRef ?? "",
      r.status,
    ].join("\t"),
  );
  const tsv = [header, ...lines].join("\n");
  const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments_${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PaymentsPage() {
  const [period, setPeriod] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);

  const from = periodCutoff(period);

  const params: ProviderPaymentsParams = {
    page: page + 1,
    limit: PAGE_SIZE,
    from,
    status: statusFilter !== "all" ? (statusFilter as PaymentStatus) : undefined,
  };

  const paymentsQ = useQuery({
    queryKey: queryKeys.providerPayments(params),
    queryFn: () => providerApi.listPayments(params),
    placeholderData: (prev) => prev,
  });

  const result = paymentsQ.data;
  const allRows = result?.data ?? [];
  const total = result?.meta.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const summary = result?.summary;

  const filtered = search
    ? allRows.filter((r) =>
        (r.subscription?.company.name ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : allRows;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Оплаты и выручка"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={filtered.length === 0} onClick={() => exportCSV(filtered)}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" disabled={filtered.length === 0} onClick={() => exportExcel(filtered)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Выручка за период", value: summary ? `$${summary.totalAmount.toFixed(2)}` : null },
          { label: "Всего платежей", value: summary ? String(summary.count) : null },
          { label: "Всего (все стр.)", value: total > 0 ? String(total) : null },
          { label: "Средний чек", value: summary ? `$${summary.avgAmount.toFixed(2)}` : null },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            {paymentsQ.isLoading ? (
              <Skeleton className="mt-1 h-8 w-20 rounded" />
            ) : (
              <div className="mt-1 text-2xl font-bold text-foreground">{s.value ?? "—"}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по компании..."
            className="pl-9 w-52"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(0); }}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Последние 30 дней</SelectItem>
            <SelectItem value="90">Последние 90 дней</SelectItem>
            <SelectItem value="180">Последние 6 месяцев</SelectItem>
            <SelectItem value="all">Весь период</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value={PaymentStatus.PAID}>Оплачено</SelectItem>
            <SelectItem value={PaymentStatus.PENDING}>Ожидание</SelectItem>
            <SelectItem value={PaymentStatus.FAILED}>Ошибка</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {paymentsQ.isError ? (
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          Не удалось загрузить данные.
          <Button variant="outline" size="sm" className="ml-3" onClick={() => paymentsQ.refetch()}>
            Повторить
          </Button>
        </div>
      ) : paymentsQ.isLoading ? (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Дата", "Компания", "Сумма", "Период", "Провайдер", "Статус"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="Платежи не найдены"
          description="Попробуйте изменить фильтры или период"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Компания</th>
                <th className="px-4 py-3 font-medium">Сумма</th>
                <th className="px-4 py-3 font-medium">Период</th>
                <th className="px-4 py-3 font-medium">Провайдер</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{p.subscription?.company.name ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">${p.amountUsd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtPeriod(p.periodStart, p.periodEnd)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.provider}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>Показано {filtered.length} из {total}</span>
            {total > PAGE_SIZE && (
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Назад</Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Вперёд</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
