import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Search, Play, PauseCircle, Trash2 } from "lucide-react";
import { CompanyStatus, SubStatus } from "@softtime/shared";
import { PageHeader, StatusBadge, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
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
import { providerApi } from "@/entities/provider/api";
import { queryKeys } from "@/shared/api/query-keys";
import type { ProviderCompanyListItem } from "@/entities/provider/model/types";

const PAGE_SIZE = 20;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

type DialogAction = "activate" | "suspend" | "delete";

export function CompaniesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<{
    open: boolean;
    company: ProviderCompanyListItem | null;
    action: DialogAction;
  }>({ open: false, company: null, action: "activate" });

  const params = {
    page: page + 1,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as CompanyStatus) : undefined,
    subscriptionStatus: subStatusFilter !== "all" ? (subStatusFilter as SubStatus) : undefined,
  };

  const companiesQ = useQuery({
    queryKey: queryKeys.providerCompanies(params),
    queryFn: () => providerApi.listCompanies(params),
    placeholderData: (prev) => prev,
  });

  const companies = companiesQ.data?.data ?? [];
  const total = companiesQ.data?.meta.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const activateMut = useMutation({
    mutationFn: (id: string) => providerApi.activateCompany(id),
    onSuccess: () => {
      toast.success("Компания активирована");
      setDialog({ open: false, company: null, action: "activate" });
      qc.invalidateQueries({ queryKey: ["provider-companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.providerDashboard });
    },
    onError: () => toast.error("Ошибка при активации"),
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => providerApi.suspendCompany(id),
    onSuccess: () => {
      toast.success("Компания приостановлена");
      setDialog({ open: false, company: null, action: "activate" });
      qc.invalidateQueries({ queryKey: ["provider-companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.providerDashboard });
    },
    onError: () => toast.error("Ошибка при приостановке"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => providerApi.deleteCompany(id),
    onSuccess: () => {
      toast.success("Компания удалена");
      setDialog({ open: false, company: null, action: "activate" });
      qc.invalidateQueries({ queryKey: ["provider-companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.providerDashboard });
    },
    onError: () => toast.error("Ошибка при удалении"),
  });

  const mutPending = activateMut.isPending || suspendMut.isPending || deleteMut.isPending;

  function openDialog(company: ProviderCompanyListItem, action: DialogAction) {
    setDialog({ open: true, company, action });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Компании" />

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или коду..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value={CompanyStatus.ACTIVE}>Активные</SelectItem>
            <SelectItem value={CompanyStatus.TRIAL}>Триал</SelectItem>
            <SelectItem value={CompanyStatus.GRACE}>Льготный период</SelectItem>
            <SelectItem value={CompanyStatus.SUSPENDED}>Приостановлено</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subStatusFilter} onValueChange={(v) => { setSubStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Статус подписки" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все подписки</SelectItem>
            <SelectItem value={SubStatus.TRIAL}>Триал</SelectItem>
            <SelectItem value={SubStatus.ACTIVE}>Активная</SelectItem>
            <SelectItem value={SubStatus.GRACE}>Льготный период</SelectItem>
            <SelectItem value={SubStatus.EXPIRED}>Истекла</SelectItem>
            <SelectItem value={SubStatus.CANCELLED}>Отменена</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {companiesQ.isError ? (
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          Не удалось загрузить данные.
          <Button variant="outline" size="sm" className="ml-3" onClick={() => companiesQ.refetch()}>
            Повторить
          </Button>
        </div>
      ) : companiesQ.isLoading ? (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Компания", "Сотр.", "Статус", "Подписка", "Следующий платёж", "Зарегистрирована", ""].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : companies.length === 0 ? (
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
                <th className="px-3 py-2.5 font-medium text-center">Сотр.</th>
                <th className="px-3 py-2.5 font-medium">Статус</th>
                <th className="px-3 py-2.5 font-medium">Подписка</th>
                <th className="px-3 py-2.5 font-medium">След. платёж</th>
                <th className="px-3 py-2.5 font-medium">Регистрация</th>
                <th className="px-3 py-2.5 font-medium w-40">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate({ to: "/provider/companies/$id", params: { id: c.id } })}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium leading-tight text-foreground">{c.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">{c.companyCode}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">{c._count.users}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    {c.subscription ? <StatusBadge status={c.subscription.status} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                    {fmtDate(c.subscription?.nextBillingAt ?? c.subscription?.periodEnd)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                    {fmtDate(c.createdAt)}
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {c.status === CompanyStatus.SUSPENDED ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-[#1877F2] hover:bg-[#EBF2FF] hover:text-[#1877F2]"
                          onClick={() => openDialog(c, "activate")}
                        >
                          <Play className="h-3 w-3" />
                          Включить
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => openDialog(c, "suspend")}
                        >
                          <PauseCircle className="h-3 w-3" />
                          Стоп
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => openDialog(c, "delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} из {total}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Назад</Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Вперёд</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm dialog ───────────────────────────────────────────────── */}
      <AlertDialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog.action === "activate"
                ? "Активировать компанию?"
                : dialog.action === "suspend"
                  ? "Приостановить компанию?"
                  : "Удалить компанию?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.action === "activate"
                ? `Компания «${dialog.company?.name}» получит статус ACTIVE и доступ к платформе.`
                : dialog.action === "suspend"
                  ? `Компания «${dialog.company?.name}» будет приостановлена. Сотрудники не смогут использовать приложение.`
                  : `Компания «${dialog.company?.name}» и все связанные данные (сотрудники, посещаемость, новости, платежи) будут безвозвратно удалены.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className={dialog.action !== "activate" ? "bg-destructive text-white hover:bg-destructive/90" : ""}
              disabled={mutPending}
              onClick={() => {
                if (!dialog.company) return;
                if (dialog.action === "activate") activateMut.mutate(dialog.company.id);
                else if (dialog.action === "suspend") suspendMut.mutate(dialog.company.id);
                else deleteMut.mutate(dialog.company.id);
              }}
            >
              {mutPending
                ? "Обработка..."
                : dialog.action === "activate"
                  ? "Активировать"
                  : dialog.action === "suspend"
                    ? "Приостановить"
                    : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
