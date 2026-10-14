import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { dateFnsLocale } from "@/shared/lib/date-locale";
import { ChevronLeft, Building2, CreditCard, Users } from "lucide-react";
import { PageHeader, StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { providerApi } from "@/entities/provider/api";
import { queryKeys } from "@/shared/api/query-keys";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: dateFnsLocale() });
  } catch {
    return iso;
  }
}

function fmtPeriod(start: string, end: string) {
  try {
    return `${format(new Date(start), "MMM yyyy", { locale: dateFnsLocale() })} – ${format(new Date(end), "MMM yyyy", { locale: dateFnsLocale() })}`;
  } catch {
    return `${start} – ${end}`;
  }
}

export function CompanyDetailPage() {
  const { t } = useTranslation(["provider", "common"]);
  const { id } = useParams({ from: "/provider/companies/$id" });
  const navigate = useNavigate();

  const companyQ = useQuery({
    queryKey: queryKeys.providerCompany(id),
    queryFn: () => providerApi.getCompany(id),
    enabled: Boolean(id),
  });

  const company = companyQ.data;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate({ to: "/provider/companies" })}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {t("provider:companyDetail.backToList")}
      </Button>

      {companyQ.isError ? (
        <div className="rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-sm">
          {t("provider:companyDetail.notFound")}
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
          <PageHeader title={company.name} />

          {/* Info + Subscription */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2FF]">
                  <Building2 className="h-4 w-4 text-[#1877F2]" />
                </div>
                <span className="font-semibold text-foreground">{t("provider:companyDetail.info")}</span>
              </div>
              <div className="space-y-3">
                <InfoRow label={t("provider:companyDetail.name")} value={company.name} />
                <InfoRow
                  label={t("provider:companyDetail.companyCode")}
                  value={<code className="font-mono text-sm">{company.companyCode}</code>}
                />
                <InfoRow label={t("common:status")} value={<StatusBadge status={company.status} />} />
                <InfoRow label={t("provider:companyDetail.employeesCount")} value={String(company.users.length)} />
                <InfoRow label={t("provider:companyDetail.registered")} value={fmtDate(company.createdAt)} />
              </div>
            </div>

            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2FF]">
                  <CreditCard className="h-4 w-4 text-[#1877F2]" />
                </div>
                <span className="font-semibold text-foreground">{t("provider:companyDetail.subscription")}</span>
              </div>
              {company.subscription ? (
                <div className="space-y-3">
                  <InfoRow
                    label={t("provider:companyDetail.plan")}
                    value={`$${company.subscription.priceUsd}${t("provider:subscriptionWidget.perMonth")}`}
                  />
                  <InfoRow
                    label={t("common:status")}
                    value={<StatusBadge status={company.subscription.status} />}
                  />
                  <InfoRow
                    label={t("provider:companyDetail.period")}
                    value={fmtPeriod(company.subscription.periodStart, company.subscription.periodEnd)}
                  />
                  <InfoRow
                    label={t("provider:companyDetail.nextPayment")}
                    value={fmtDate(company.subscription.nextBillingAt ?? company.subscription.periodEnd)}
                  />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("provider:companyDetail.noSubscription")}</div>
              )}
            </div>
          </div>

          {/* Employees (read-only) */}
          <div className="rounded-2xl bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{t("provider:companyDetail.employees")}</span>
              <span className="ml-auto text-sm text-muted-foreground">
                {t("common:peopleShort", { count: company.users.length })}
              </span>
            </div>
            {company.users.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("provider:companyDetail.noEmployees")}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("common:fullName")}</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">{t("common:role")}</th>
                    <th className="px-4 py-3 font-medium">{t("common:status")}</th>
                    <th className="px-4 py-3 font-medium">{t("provider:companyDetail.addedAt")}</th>
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
              <span className="font-semibold text-foreground">{t("provider:companyDetail.paymentHistory")}</span>
            </div>
            {!company.subscription || company.subscription.payments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("provider:companyDetail.noPayments")}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("common:date")}</th>
                    <th className="px-4 py-3 font-medium">{t("common:amount")}</th>
                    <th className="px-4 py-3 font-medium">{t("common:period")}</th>
                    <th className="px-4 py-3 font-medium">{t("common:provider")}</th>
                    <th className="px-4 py-3 font-medium">{t("common:status")}</th>
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
