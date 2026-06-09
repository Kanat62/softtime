import { useState, useMemo } from "react";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

interface PaymentRow {
  id: string;
  date: string;
  dateISO: string;
  company: string;
  amount: number;
  amountFormatted: string;
  period: string;
  method: string;
  status: "PAID" | "PENDING" | "REJECTED";
}

const ALL_PAYMENTS: PaymentRow[] = [
  {
    id: "p1",
    date: "3 июн 2026",
    dateISO: "2026-06-03",
    company: "Digital Uzbekistan",
    amount: 60,
    amountFormatted: "$60.00",
    period: "июн 2026",
    method: "Visa •••• 1881",
    status: "PAID",
  },
  {
    id: "p2",
    date: "2 июн 2026",
    dateISO: "2026-06-02",
    company: "Toshkent Bank",
    amount: 60,
    amountFormatted: "$60.00",
    period: "июн 2026",
    method: "Mastercard •••• 4422",
    status: "PAID",
  },
  {
    id: "p3",
    date: "1 июн 2026",
    dateISO: "2026-06-01",
    company: "Asia Logistics",
    amount: 30,
    amountFormatted: "$30.00",
    period: "июн 2026",
    method: "Visa •••• 9090",
    status: "PAID",
  },
  {
    id: "p4",
    date: "1 июн 2026",
    dateISO: "2026-06-01",
    company: "Bek Group",
    amount: 30,
    amountFormatted: "$30.00",
    period: "июн 2026",
    method: "Humo •••• 3344",
    status: "PAID",
  },
  {
    id: "p5",
    date: "31 май 2026",
    dateISO: "2026-05-31",
    company: "Plov Center",
    amount: 30,
    amountFormatted: "$30.00",
    period: "май 2026",
    method: "Visa •••• 7711",
    status: "PENDING",
  },
  {
    id: "p6",
    date: "28 май 2026",
    dateISO: "2026-05-28",
    company: "Green Market",
    amount: 30,
    amountFormatted: "$30.00",
    period: "май 2026",
    method: "Visa •••• 5566",
    status: "REJECTED",
  },
  {
    id: "p7",
    date: "3 май 2026",
    dateISO: "2026-05-03",
    company: "Digital Uzbekistan",
    amount: 60,
    amountFormatted: "$60.00",
    period: "май 2026",
    method: "Visa •••• 1881",
    status: "PAID",
  },
  {
    id: "p8",
    date: "2 май 2026",
    dateISO: "2026-05-02",
    company: "Toshkent Bank",
    amount: 60,
    amountFormatted: "$60.00",
    period: "май 2026",
    method: "Mastercard •••• 4422",
    status: "PAID",
  },
  {
    id: "p9",
    date: "1 май 2026",
    dateISO: "2026-05-01",
    company: "Asia Logistics",
    amount: 30,
    amountFormatted: "$30.00",
    period: "май 2026",
    method: "Visa •••• 9090",
    status: "PAID",
  },
  {
    id: "p10",
    date: "15 май 2026",
    dateISO: "2026-05-15",
    company: "Bek Group",
    amount: 30,
    amountFormatted: "$30.00",
    period: "май 2026",
    method: "Humo •••• 3344",
    status: "PAID",
  },
  {
    id: "p11",
    date: "2 апр 2026",
    dateISO: "2026-04-02",
    company: "Toshkent Bank",
    amount: 60,
    amountFormatted: "$60.00",
    period: "апр 2026",
    method: "Mastercard •••• 4422",
    status: "PAID",
  },
  {
    id: "p12",
    date: "1 апр 2026",
    dateISO: "2026-04-01",
    company: "Asia Logistics",
    amount: 30,
    amountFormatted: "$30.00",
    period: "апр 2026",
    method: "Visa •••• 9090",
    status: "PAID",
  },
  {
    id: "p13",
    date: "15 апр 2026",
    dateISO: "2026-04-15",
    company: "Bek Group",
    amount: 30,
    amountFormatted: "$30.00",
    period: "апр 2026",
    method: "Humo •••• 3344",
    status: "PAID",
  },
  {
    id: "p14",
    date: "3 июн 2026",
    dateISO: "2026-06-03",
    company: "Digital Uzbekistan",
    amount: 60,
    amountFormatted: "$60.00",
    period: "июн 2026",
    method: "Visa •••• 1881",
    status: "PAID",
  },
];

const PERIOD_OPTIONS = [
  { label: "Последние 30 дней", value: "30", cutoff: "2026-05-06" },
  { label: "Последние 90 дней", value: "90", cutoff: "2026-03-07" },
  { label: "Последние 6 месяцев", value: "180", cutoff: "2025-12-07" },
  { label: "Весь период", value: "all", cutoff: "" },
];

const COMPANIES = Array.from(new Set(ALL_PAYMENTS.map((p) => p.company))).sort();

function exportCSV(rows: PaymentRow[]) {
  const header = ["Дата", "Компания", "Сумма", "Период", "Способ оплаты", "Статус"];
  const lines = rows.map((r) =>
    [r.date, r.company, r.amountFormatted, r.period, r.method, r.status].join(";"),
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

function exportExcel(rows: PaymentRow[]) {
  const header = ["Дата\tКомпания\tСумма\tПериод\tСпособ оплаты\tСтатус"];
  const lines = rows.map((r) =>
    [r.date, r.company, r.amountFormatted, r.period, r.method, r.status].join("\t"),
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
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const cutoff = PERIOD_OPTIONS.find((o) => o.value === period)?.cutoff ?? "";
    return ALL_PAYMENTS.filter((p) => {
      const matchPeriod = !cutoff || p.dateISO >= cutoff;
      const matchCompany = companyFilter === "all" || p.company === companyFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchSearch = search === "" || p.company.toLowerCase().includes(search.toLowerCase());
      return matchPeriod && matchCompany && matchStatus && matchSearch;
    });
  }, [period, companyFilter, statusFilter, search]);

  const summary = useMemo(() => {
    const paid = filtered.filter((p) => p.status === "PAID");
    const total = paid.reduce((acc, p) => acc + p.amount, 0);
    const avg = paid.length > 0 ? total / paid.length : 0;
    return {
      total: `$${total.toFixed(2)}`,
      count: filtered.length,
      paid: paid.length,
      avg: `$${avg.toFixed(2)}`,
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Оплаты и выручка"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(filtered)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Выручка за период", value: summary.total },
          { label: "Всего платежей", value: String(summary.count) },
          { label: "Успешных", value: String(summary.paid) },
          { label: "Средний чек", value: summary.avg },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card shadow-sm p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по компании..."
            className="pl-9 w-52"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Все компании" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все компании</SelectItem>
            {COMPANIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="PAID">Оплачено</SelectItem>
            <SelectItem value="PENDING">Ожидание</SelectItem>
            <SelectItem value="REJECTED">Отклонено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
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
                <th className="px-4 py-3 font-medium">Способ оплаты</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{p.company}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{p.amountFormatted}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.period}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.method}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Показано {filtered.length} платежей
          </div>
        </div>
      )}
    </div>
  );
}
