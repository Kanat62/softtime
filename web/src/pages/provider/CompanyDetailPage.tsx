import { useParams, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Building2, CreditCard, Users } from "lucide-react";
import { StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";

const COMPANY_DATA: Record<
  string,
  {
    id: string;
    name: string;
    code: string;
    admin: string;
    adminEmail: string;
    employees: number;
    status: string;
    subscriptionStatus: string;
    nextPayment: string;
    registeredAt: string;
    tariff: string;
  }
> = {
  "1": {
    id: "1",
    name: "SoftTime LLC",
    code: "ST-2026-A1B2",
    admin: "Alisher Umarov",
    adminEmail: "admin@softtime.uz",
    employees: 11,
    status: "TRIAL",
    subscriptionStatus: "TRIAL",
    nextPayment: "1 июл 2026",
    registeredAt: "1 июн 2026",
    tariff: "$30/мес",
  },
  "2": {
    id: "2",
    name: "Bek Group",
    code: "BG-2025-X7Y2",
    admin: "Bekzod Karimov",
    adminEmail: "ceo@bekgroup.uz",
    employees: 34,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "15 июн 2026",
    registeredAt: "15 май 2025",
    tariff: "$30/мес",
  },
  "3": {
    id: "3",
    name: "Toshkent Bank",
    code: "TB-2024-K3M9",
    admin: "Jasur Nazarov",
    adminEmail: "it@tb.uz",
    employees: 87,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "2 июл 2026",
    registeredAt: "2 июн 2024",
    tariff: "$60/мес",
  },
  "4": {
    id: "4",
    name: "Plov Center",
    code: "PC-2025-N4Q1",
    admin: "Nodir Toshmatov",
    adminEmail: "owner@plov.uz",
    employees: 22,
    status: "GRACE",
    subscriptionStatus: "GRACE",
    nextPayment: "7 июн 2026",
    registeredAt: "1 апр 2025",
    tariff: "$30/мес",
  },
  "5": {
    id: "5",
    name: "Asia Logistics",
    code: "AL-2025-R8T6",
    admin: "Sarvar Yusupov",
    adminEmail: "office@asial.uz",
    employees: 41,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "1 июл 2026",
    registeredAt: "10 мар 2025",
    tariff: "$30/мес",
  },
  "6": {
    id: "6",
    name: "Green Market",
    code: "GM-2026-B2C5",
    admin: "Dilnoza Rakhimova",
    adminEmail: "hr@gm.uz",
    employees: 18,
    status: "SUSPENDED",
    subscriptionStatus: "SUSPENDED",
    nextPayment: "—",
    registeredAt: "3 май 2026",
    tariff: "$30/мес",
  },
  "7": {
    id: "7",
    name: "Digital Uzbekistan",
    code: "DU-2025-W9E3",
    admin: "Kamol Xasanov",
    adminEmail: "info@du.uz",
    employees: 56,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "3 июл 2026",
    registeredAt: "20 апр 2025",
    tariff: "$60/мес",
  },
};

const EMPLOYEES_BY_COMPANY: Record<
  string,
  { id: string; name: string; email: string; status: string; hiredAt: string }[]
> = {
  "1": [
    {
      id: "e1",
      name: "Иван Петров",
      email: "ivan@softtime.uz",
      status: "ACTIVE",
      hiredAt: "1 июн 2026",
    },
    {
      id: "e2",
      name: "Мария Сидорова",
      email: "maria@softtime.uz",
      status: "ACTIVE",
      hiredAt: "1 июн 2026",
    },
    {
      id: "e3",
      name: "Алексей Иванов",
      email: "alex@softtime.uz",
      status: "PENDING",
      hiredAt: "2 июн 2026",
    },
  ],
  "2": [
    {
      id: "e4",
      name: "Зафар Алиев",
      email: "zafar@bekgroup.uz",
      status: "ACTIVE",
      hiredAt: "20 май 2025",
    },
    {
      id: "e5",
      name: "Нилуфар Каримова",
      email: "nilufar@bekgroup.uz",
      status: "ACTIVE",
      hiredAt: "20 май 2025",
    },
  ],
};

const PAYMENTS_BY_COMPANY: Record<
  string,
  { id: string; date: string; amount: string; period: string; status: string; method: string }[]
> = {
  "1": [],
  "2": [
    {
      id: "p1",
      date: "15 май 2026",
      amount: "$30.00",
      period: "май 2026",
      status: "PAID",
      method: "Visa •••• 1881",
    },
    {
      id: "p2",
      date: "15 апр 2026",
      amount: "$30.00",
      period: "апр 2026",
      status: "PAID",
      method: "Visa •••• 1881",
    },
  ],
  "3": [
    {
      id: "p3",
      date: "2 июн 2026",
      amount: "$60.00",
      period: "июн 2026",
      status: "PAID",
      method: "Mastercard •••• 4422",
    },
    {
      id: "p4",
      date: "2 май 2026",
      amount: "$60.00",
      period: "май 2026",
      status: "PAID",
      method: "Mastercard •••• 4422",
    },
    {
      id: "p5",
      date: "2 апр 2026",
      amount: "$60.00",
      period: "апр 2026",
      status: "PAID",
      method: "Mastercard •••• 4422",
    },
  ],
  "4": [
    {
      id: "p6",
      date: "31 май 2026",
      amount: "$30.00",
      period: "май 2026",
      status: "PENDING",
      method: "Visa •••• 7711",
    },
    {
      id: "p7",
      date: "1 апр 2026",
      amount: "$30.00",
      period: "апр 2026",
      status: "PAID",
      method: "Visa •••• 7711",
    },
  ],
  "6": [
    {
      id: "p8",
      date: "28 май 2026",
      amount: "$30.00",
      period: "май 2026",
      status: "REJECTED",
      method: "Visa •••• 5566",
    },
  ],
  "7": [
    {
      id: "p9",
      date: "3 июн 2026",
      amount: "$60.00",
      period: "июн 2026",
      status: "PAID",
      method: "Visa •••• 1881",
    },
    {
      id: "p10",
      date: "3 май 2026",
      amount: "$60.00",
      period: "май 2026",
      status: "PAID",
      method: "Visa •••• 1881",
    },
  ],
};

export function CompanyDetailPage() {
  const { id } = useParams({ from: "/provider/companies/$id" });
  const navigate = useNavigate();
  const company = COMPANY_DATA[id];

  if (!company) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/provider/companies" })}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Назад
        </Button>
        <div className="rounded-2xl bg-card shadow-sm p-10 text-center text-muted-foreground">
          Компания не найдена
        </div>
      </div>
    );
  }

  const employees = EMPLOYEES_BY_COMPANY[id] ?? [];
  const payments = PAYMENTS_BY_COMPANY[id] ?? [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate({ to: "/provider/companies" })}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Все компании
      </Button>

      {/* Info + subscription */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Company info */}
        <div className="rounded-2xl bg-card shadow-sm p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2FF]">
              <Building2 className="h-4 w-4 text-[#1877F2]" />
            </div>
            <span className="font-semibold text-foreground">Информация</span>
          </div>
          <div className="space-y-3">
            <InfoRow label="Название" value={company.name} />
            <InfoRow
              label="Код компании"
              value={<code className="font-mono text-sm">{company.code}</code>}
            />
            <InfoRow label="Администратор" value={company.admin} />
            <InfoRow label="Email" value={company.adminEmail} />
            <InfoRow label="Сотрудников" value={String(company.employees)} />
            <InfoRow label="Зарегистрирована" value={company.registeredAt} />
            <InfoRow label="Статус" value={<StatusBadge status={company.status} />} />
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl bg-card shadow-sm p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2FF]">
              <CreditCard className="h-4 w-4 text-[#1877F2]" />
            </div>
            <span className="font-semibold text-foreground">Подписка</span>
          </div>
          <div className="space-y-3">
            <InfoRow label="Тариф" value={company.tariff} />
            <InfoRow
              label="Статус подписки"
              value={<StatusBadge status={company.subscriptionStatus} />}
            />
            <InfoRow label="Следующая оплата" value={company.nextPayment} />
          </div>
        </div>
      </div>

      {/* Employees (read-only) */}
      <div className="rounded-2xl bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">Сотрудники</span>
          <span className="ml-auto text-sm text-muted-foreground">{company.employees} чел.</span>
        </div>
        {employees.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Нет данных о сотрудниках
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ФИО</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Принят</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{e.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.hiredAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment history */}
      <div className="rounded-2xl bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">История платежей</span>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Платежей пока нет
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Сумма</th>
                <th className="px-4 py-3 font-medium">Период</th>
                <th className="px-4 py-3 font-medium">Способ</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{p.amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.period}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.method}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
