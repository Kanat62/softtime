import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Play, PauseCircle } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

type CompanyStatus = "TRIAL" | "ACTIVE" | "GRACE" | "SUSPENDED";

interface Company {
  id: string;
  name: string;
  code: string;
  admin: string;
  employees: number;
  status: CompanyStatus;
  subscriptionStatus: string;
  nextPayment: string;
  registeredAt: string;
}

const COMPANIES: Company[] = [
  {
    id: "1",
    name: "SoftTime LLC",
    code: "ST-2026-A1B2",
    admin: "admin@softtime.uz",
    employees: 11,
    status: "TRIAL",
    subscriptionStatus: "TRIAL",
    nextPayment: "1 июл 2026",
    registeredAt: "1 июн 2026",
  },
  {
    id: "2",
    name: "Bek Group",
    code: "BG-2025-X7Y2",
    admin: "ceo@bekgroup.uz",
    employees: 34,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "15 июн 2026",
    registeredAt: "15 май 2025",
  },
  {
    id: "3",
    name: "Toshkent Bank",
    code: "TB-2024-K3M9",
    admin: "it@tb.uz",
    employees: 87,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "2 июл 2026",
    registeredAt: "2 июн 2024",
  },
  {
    id: "4",
    name: "Plov Center",
    code: "PC-2025-N4Q1",
    admin: "owner@plov.uz",
    employees: 22,
    status: "GRACE",
    subscriptionStatus: "GRACE",
    nextPayment: "7 июн 2026",
    registeredAt: "1 апр 2025",
  },
  {
    id: "5",
    name: "Asia Logistics",
    code: "AL-2025-R8T6",
    admin: "office@asial.uz",
    employees: 41,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "1 июл 2026",
    registeredAt: "10 мар 2025",
  },
  {
    id: "6",
    name: "Green Market",
    code: "GM-2026-B2C5",
    admin: "hr@gm.uz",
    employees: 18,
    status: "SUSPENDED",
    subscriptionStatus: "SUSPENDED",
    nextPayment: "—",
    registeredAt: "3 май 2026",
  },
  {
    id: "7",
    name: "Digital Uzbekistan",
    code: "DU-2025-W9E3",
    admin: "info@du.uz",
    employees: 56,
    status: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    nextPayment: "3 июл 2026",
    registeredAt: "20 апр 2025",
  },
];

type DialogAction = "activate" | "suspend";

export function CompaniesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companies, setCompanies] = useState<Company[]>(COMPANIES);
  const [dialog, setDialog] = useState<{
    open: boolean;
    company: Company | null;
    action: DialogAction;
  }>({ open: false, company: null, action: "activate" });

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [companies, search, statusFilter]);

  function openDialog(company: Company, action: DialogAction) {
    setDialog({ open: true, company, action });
  }

  function handleConfirm() {
    if (!dialog.company) return;
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === dialog.company!.id
          ? {
              ...c,
              status: dialog.action === "activate" ? "ACTIVE" : "SUSPENDED",
              subscriptionStatus: dialog.action === "activate" ? "ACTIVE" : "SUSPENDED",
            }
          : c,
      ),
    );
    setDialog({ open: false, company: null, action: "activate" });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Компании" />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по компании или коду..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="ACTIVE">Активные</SelectItem>
            <SelectItem value="TRIAL">Триал</SelectItem>
            <SelectItem value="GRACE">Льготный период</SelectItem>
            <SelectItem value="SUSPENDED">Приостановлено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="Компании не найдены"
          description="Попробуйте изменить фильтры или поисковый запрос"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">Компания</th>
                <th className="px-3 py-2.5 font-medium">Администратор</th>
                <th className="px-3 py-2.5 font-medium text-center">Сотр.</th>
                <th className="px-3 py-2.5 font-medium">Статус</th>
                <th className="px-3 py-2.5 font-medium">След. оплата</th>
                <th className="px-3 py-2.5 font-medium">Регистрация</th>
                <th className="px-3 py-2.5 font-medium w-28">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate({ to: "/provider/companies/$id", params: { id: c.id } })}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground leading-tight">{c.name}</div>
                    <div className="font-mono text-xs text-muted-foreground mt-0.5">{c.code}</div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{c.admin}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-center">{c.employees}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                    {c.nextPayment}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                    {c.registeredAt}
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    {c.status === "SUSPENDED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-[#1877F2] hover:text-[#1877F2] hover:bg-[#EBF2FF] px-2"
                        onClick={() => openDialog(c, "activate")}
                      >
                        <Play className="h-3 w-3" />
                        Включить
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                        onClick={() => openDialog(c, "suspend")}
                      >
                        <PauseCircle className="h-3 w-3" />
                        Стоп
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog.action === "activate" ? "Активировать компанию?" : "Приостановить компанию?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.action === "activate"
                ? `Компания «${dialog.company?.name}» получит статус ACTIVE и доступ к платформе.`
                : `Компания «${dialog.company?.name}» будет приостановлена. Сотрудники не смогут использовать приложение до возобновления.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className={
                dialog.action === "suspend"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              }
              onClick={handleConfirm}
            >
              {dialog.action === "activate" ? "Активировать" : "Приостановить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
