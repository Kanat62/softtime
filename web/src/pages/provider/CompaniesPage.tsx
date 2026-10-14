import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { dateFnsLocale } from "@/shared/lib/date-locale";
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
    return format(new Date(iso), "d MMM yyyy", { locale: dateFnsLocale() });
  } catch {
    return iso;
  }
}

type DialogAction = "activate" | "suspend" | "delete";

export function CompaniesPage() {
  const { t } = useTranslation(["provider", "enums", "common"]);
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
      toast.success(t("provider:companies.toast.activated"));
      setDialog({ open: false, company: null, action: "activate" });
      qc.invalidateQueries({ queryKey: ["provider-companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.providerDashboard });
    },
    onError: () => toast.error(t("provider:companies.toast.activateFailed")),
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => providerApi.suspendCompany(id),
    onSuccess: () => {
      toast.success(t("provider:companies.toast.suspended"));
      setDialog({ open: false, company: null, action: "activate" });
      qc.invalidateQueries({ queryKey: ["provider-companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.providerDashboard });
    },
    onError: () => toast.error(t("provider:companies.toast.suspendFailed")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => providerApi.deleteCompany(id),
    onSuccess: () => {
      toast.success(t("provider:companies.toast.deleted"));
      setDialog({ open: false, company: null, action: "activate" });
      qc.invalidateQueries({ queryKey: ["provider-companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.providerDashboard });
    },
    onError: () => toast.error(t("provider:companies.toast.deleteFailed")),
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
      <PageHeader title={t("provider:companies.title")} />

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("provider:companies.searchPlaceholder")}
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("common:allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common:allStatuses")}</SelectItem>
            <SelectItem value={CompanyStatus.ACTIVE}>{t("enums:companyStatus.ACTIVE")}</SelectItem>
            <SelectItem value={CompanyStatus.TRIAL}>{t("enums:companyStatus.TRIAL")}</SelectItem>
            <SelectItem value={CompanyStatus.GRACE}>{t("enums:companyStatus.GRACE")}</SelectItem>
            <SelectItem value={CompanyStatus.SUSPENDED}>{t("enums:companyStatus.SUSPENDED")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subStatusFilter} onValueChange={(v) => { setSubStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("provider:companies.subStatusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("provider:companies.allSubscriptions")}</SelectItem>
            <SelectItem value={SubStatus.TRIAL}>{t("enums:subStatus.TRIAL")}</SelectItem>
            <SelectItem value={SubStatus.ACTIVE}>{t("enums:subStatus.ACTIVE")}</SelectItem>
            <SelectItem value={SubStatus.GRACE}>{t("enums:subStatus.GRACE")}</SelectItem>
            <SelectItem value={SubStatus.EXPIRED}>{t("enums:subStatus.EXPIRED")}</SelectItem>
            <SelectItem value={SubStatus.CANCELLED}>{t("enums:subStatus.CANCELLED")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {companiesQ.isError ? (
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          {t("common:loadFailed2")}
          <Button variant="outline" size="sm" className="ml-3" onClick={() => companiesQ.refetch()}>
            {t("common:retry")}
          </Button>
        </div>
      ) : companiesQ.isLoading ? (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {[
                  t("provider:companies.columns.company"),
                  t("provider:companies.columns.employeesShort"),
                  t("common:status"),
                  t("provider:companies.columns.subscription"),
                  t("provider:companies.columns.nextPayment"),
                  t("provider:companies.columns.registered"),
                  "",
                ].map((h) => (
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
          title={t("provider:companies.emptyTitle")}
          description={t("provider:companies.emptyDescription")}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">{t("provider:companies.columns.company")}</th>
                <th className="px-3 py-2.5 font-medium text-center">{t("provider:companies.columns.employeesShort")}</th>
                <th className="px-3 py-2.5 font-medium">{t("common:status")}</th>
                <th className="px-3 py-2.5 font-medium">{t("provider:companies.columns.subscription")}</th>
                <th className="px-3 py-2.5 font-medium">{t("provider:companies.columns.nextPaymentShort")}</th>
                <th className="px-3 py-2.5 font-medium">{t("provider:companies.columns.registeredShort")}</th>
                <th className="px-3 py-2.5 font-medium w-40">{t("common:actions")}</th>
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
                          {t("provider:companies.activate")}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => openDialog(c, "suspend")}
                        >
                          <PauseCircle className="h-3 w-3" />
                          {t("provider:companies.suspend")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => openDialog(c, "delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                        {t("common:delete")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>
                {t("common:pagination.range", {
                  from: page * PAGE_SIZE + 1,
                  to: Math.min((page + 1) * PAGE_SIZE, total),
                  total,
                })}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("common:back")}</Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>{t("common:next")}</Button>
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
                ? t("provider:companies.dialog.activateTitle")
                : dialog.action === "suspend"
                  ? t("provider:companies.dialog.suspendTitle")
                  : t("provider:companies.dialog.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.action === "activate"
                ? t("provider:companies.dialog.activateText", { name: dialog.company?.name })
                : dialog.action === "suspend"
                  ? t("provider:companies.dialog.suspendText", { name: dialog.company?.name })
                  : t("provider:companies.dialog.deleteText", { name: dialog.company?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutPending}>{t("common:cancel")}</AlertDialogCancel>
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
                ? t("common:processing")
                : dialog.action === "activate"
                  ? t("provider:companies.dialog.activateConfirm")
                  : dialog.action === "suspend"
                    ? t("provider:companies.dialog.suspendConfirm")
                    : t("common:delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
