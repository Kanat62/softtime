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

const MONTHLY_DATA = [
  { month: "Июл'25", companies: 4, revenue: 120 },
  { month: "Авг'25", companies: 6, revenue: 180 },
  { month: "Сен'25", companies: 7, revenue: 210 },
  { month: "Окт'25", companies: 9, revenue: 270 },
  { month: "Ноя'25", companies: 11, revenue: 330 },
  { month: "Дек'25", companies: 13, revenue: 390 },
  { month: "Янв'26", companies: 14, revenue: 420 },
  { month: "Фев'26", companies: 16, revenue: 480 },
  { month: "Мар'26", companies: 18, revenue: 540 },
  { month: "Апр'26", companies: 20, revenue: 600 },
  { month: "Май'26", companies: 22, revenue: 630 },
  { month: "Июн'26", companies: 24, revenue: 660 },
];

const RECENT_REGISTRATIONS = [
  { id: "1", name: "SoftTime LLC", code: "ST-2026-A1B2", status: "TRIAL", date: "1 июн 2026" },
  { id: "2", name: "Bek Group", code: "BG-2025-X7Y2", status: "ACTIVE", date: "15 май 2026" },
  { id: "3", name: "Green Market", code: "GM-2026-B2C5", status: "SUSPENDED", date: "3 май 2026" },
  {
    id: "4",
    name: "Digital Uzbekistan",
    code: "DU-2025-W9E3",
    status: "ACTIVE",
    date: "20 апр 2026",
  },
  { id: "5", name: "Plov Center", code: "PC-2025-N4Q1", status: "GRACE", date: "1 апр 2026" },
];

const RECENT_PAYMENTS = [
  { id: "1", company: "Digital Uzbekistan", amount: "$60.00", date: "3 июн 2026", status: "PAID" },
  { id: "2", company: "Toshkent Bank", amount: "$60.00", date: "2 июн 2026", status: "PAID" },
  { id: "3", company: "Asia Logistics", amount: "$30.00", date: "1 июн 2026", status: "PAID" },
  { id: "4", company: "Bek Group", amount: "$30.00", date: "1 июн 2026", status: "PAID" },
  { id: "5", company: "Plov Center", amount: "$30.00", date: "31 май 2026", status: "PENDING" },
];

const METRICS = [
  {
    label: "Всего компаний",
    value: "24",
    icon: Building2,
    color: "text-[#1877F2]",
    bg: "bg-[#EBF2FF]",
  },
  { label: "Активных", value: "14", icon: TrendingUp, color: "text-[#22C55E]", bg: "bg-[#DCFCE7]" },
  { label: "На триале", value: "6", icon: Building2, color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
  {
    label: "Приостановлено",
    value: "4",
    icon: PauseCircle,
    color: "text-[#EF4444]",
    bg: "bg-[#FEE2E2]",
  },
  { label: "MRR", value: "$660", icon: DollarSign, color: "text-[#1877F2]", bg: "bg-[#EBF2FF]" },
  {
    label: "Суммарная выручка",
    value: "$4 830",
    icon: DollarSign,
    color: "text-[#22C55E]",
    bg: "bg-[#DCFCE7]",
  },
];

export function ProviderDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд платформы" />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-2xl bg-card shadow-sm p-5">
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}
              >
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{m.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Company growth chart */}
        <div className="rounded-2xl bg-card shadow-sm p-5">
          <div className="mb-1 font-semibold text-foreground">Рост компаний</div>
          <div className="mb-4 text-xs text-muted-foreground">Накопительно за 12 месяцев</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="companies"
                name="Компании"
                stroke="#1877F2"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl bg-card shadow-sm p-5">
          <div className="mb-1 font-semibold text-foreground">Выручка по месяцам</div>
          <div className="mb-4 text-xs text-muted-foreground">USD за последние 12 месяцев</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1877F2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
                formatter={(v: number) => [`$${v}`, "Выручка"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Выручка"
                stroke="#1877F2"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent registrations */}
        <div className="rounded-2xl bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <div className="font-semibold text-foreground">Последние регистрации</div>
          </div>
          <div className="divide-y divide-border">
            {RECENT_REGISTRATIONS.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{c.code}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-muted-foreground">{c.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="rounded-2xl bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <div className="font-semibold text-foreground">Последние платежи</div>
          </div>
          <div className="divide-y divide-border">
            {RECENT_PAYMENTS.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{p.company}</div>
                  <div className="text-xs text-muted-foreground">{p.date}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-foreground">{p.amount}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
