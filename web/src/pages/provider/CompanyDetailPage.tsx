import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { ChevronLeft, Building2, CreditCard, Users, Trash2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

function fmtPeriod(start: string, end: string) {
  try {
    return `${format(new Date(start), "MMM yyyy", { locale: ru })} – ${format(new Date(end), "MMM yyyy", { locale: ru })}`;
  } catch {
    return `${start} – ${end}`;
  }
}

export function CompanyDetailPage() {
  const { id } = useParams({ from: "/provider/companies/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const companyQ = useQuery({
    queryKey: queryKeys.providerCompany(id),
    queryFn: () => providerApi.getCompany(id),
    enabled: Boolean(id),
  });

  const company = companyQ.data;

  const deleteMutation = useMutation({
    mutationFn: () => providerApi.deleteCompany(id),
    onSuccess: () => {
      toast.success("Компания удалена");
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ["provider-companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.providerDashboard });
      navigate({ to: "/provider/companies" });
    },
    onError: () => toast.error("Не удалось удалить компанию"),
  });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate({ to: "/provider/companies" })}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Все компании
      </Button>

      {companyQ.isError ? (
        <div className="rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-sm">
          Компания не найдена или произошла ошибка.
        </div>
      ) : companyQ.isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl bg-card p-5 shadow-sm space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-full rounded" />
                ))}
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-sm space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-5 w-full rounded" />
            ))}
          </div>
        </div>
      ) : company ? (
        <>
          <PageHeader
            title={company.name}
            actions={
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить компанию
              </Button>
            }
          />

          {/* Info + Subscription */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-card p-5 shadow-sm">
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
                  value={<code className="font-mono text-sm">{company.companyCode}</code>}
                />
                <InfoRow label="Статус" value={<StatusBadge status={company.status} />} />
                <InfoRow label="Сотрудников" value={String(company.users.length)} />
                <InfoRow label="Зарегистрирована" value={fmtDate(company.createdAt)} />
              </div>
            </div>

            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2FF]">
                  <CreditCard className="h-4 w-4 text-[#1877F2]" />
                </div>
                <span className="font-semibold text-foreground">Подписка</span>
              </div>
              {company.subscription ? (
                <div className="space-y-3">
                  <InfoRow label="Тариф" value={`$${company.subscription.priceUsd}/мес`} />
                  <InfoRow
                    label="Статус"
                    value={<StatusBadge status={company.subscription.status} />}
                  />
                  <InfoRow label="Период" value={fmtPeriod(company.subscription.periodStart, company.subscription.periodEnd)} />
                  <InfoRow
                    label="Следующий платёж"
                    value={fmtDate(company.subscription.nextBillingAt ?? company.subscription.periodEnd)}
                  />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Подписка не найдена</div>
              )}
            </div>
          </div>

          {/* Employees (read-only) */}
          <div className="rounded-2xl bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">Сотрудники</span>
              <span className="ml-auto text-sm text-muted-foreground">{company.users.length} чел.</span>
            </div>
            {company.users.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Нет данных о сотрудниках
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">ФИО</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Роль</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium">Добавлен</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {company.users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{u.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.createdAt)}</td>
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
            {!company.subscription || company.subscription.payments.length === 0 ? (
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
                    <th className="px-4 py-3 font-medium">Провайдер</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {company.subscription.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">${p.amountUsd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtPeriod(p.periodStart, p.periodEnd)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.provider}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Delete confirmation ──────────────────────────────────────────── */}
          <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить компанию «{company.name}»?</AlertDialogTitle>
                <AlertDialogDescription>
                  Будут безвозвратно удалены из базы данных: аккаунт админа,{" "}
                  {company.users.length} пользовател{company.users.length === 1 ? "ь" : "ей"},
                  вся посещаемость, графики, заявки, QR-коды, новости, подписка и платежи.
                  Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    deleteMutation.mutate();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Удаляем..." : "Удалить навсегда"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
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
