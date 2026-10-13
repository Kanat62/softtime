import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { dateFnsLocale } from "@/shared/lib/date-locale";
import { toast } from "sonner";
import { AlertTriangle, Check, CreditCard, Download, ExternalLink, Loader2 } from "lucide-react";
import { subscriptionApi } from "@/entities/subscription/api";
import { paymentApi } from "@/entities/payment/api";
import { queryKeys } from "@/shared/api/query-keys";
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
import { useState } from "react";

const FEATURES = [
  "employees",
  "checkins",
  "reports",
  "news",
  "support",
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMMM yyyy", { locale: dateFnsLocale() });
  } catch {
    return iso;
  }
}

function fmtPeriod(start: string, end: string) {
  try {
    return `${format(new Date(start), "d MMM", { locale: dateFnsLocale() })} – ${format(new Date(end), "d MMM yyyy", { locale: dateFnsLocale() })}`;
  } catch {
    return `${start} – ${end}`;
  }
}

export function SubscriptionCard() {
  const { t } = useTranslation(["subscription", "common"]);
  const qc = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const subQuery = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: subscriptionApi.get,
  });

  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments({ page: 1, limit: 20 }),
    queryFn: () => paymentApi.list({ page: 1, limit: 20 }),
  });

  const payMutation = useMutation({
    mutationFn: subscriptionApi.pay,
    onSuccess: ({ checkoutUrl }) => {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      toast.success(t("subscription:toast.redirecting"));
    },
    onError: () => toast.error(t("subscription:toast.payFailed")),
  });

  const cancelMutation = useMutation({
    mutationFn: subscriptionApi.cancel,
    onSuccess: () => {
      toast.success(t("subscription:toast.cancelled"));
      setCancelDialogOpen(false);
      qc.invalidateQueries({ queryKey: queryKeys.subscription });
    },
    onError: () => toast.error(t("subscription:toast.cancelFailed")),
  });

  const receiptMutation = useMutation({
    mutationFn: (id: string) => paymentApi.downloadReceipt(id),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error(t("subscription:toast.receiptFailed")),
  });

  const sub = subQuery.data;
  const payments = paymentsQuery.data?.data ?? [];
  const canPay = sub && ["TRIAL", "GRACE", "EXPIRED"].includes(sub.status);
  const isCancelled = sub?.status === "CANCELLED";
  const daysLeft = sub?.daysLeft ?? 0;
  const progressPct = Math.max(0, Math.min(100, 100 - (daysLeft / 30) * 100));

  return (
    <div className="space-y-6">
      <PageHeader title={t("subscription:title")} />

      {/* ── CANCELLED / SUSPENDED banner ───────────────────────────────────── */}
      {isCancelled && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">{t("subscription:suspendedTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("subscription:suspendedText")}
            </p>
          </div>
        </div>
      )}

      {/* ── Status card + timer ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm lg:col-span-2">
          {subQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-7 w-48 rounded" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
          ) : sub ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{t("subscription:planName")}</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">
                    ${sub.priceUsd} {t("subscription:perMonth")}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {fmtDate(sub.periodStart)} – {fmtDate(sub.periodEnd)}
                    {sub.nextBillingAt
                      ? t("subscription:nextCharge", { date: fmtDate(sub.nextBillingAt) })
                      : ""}
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    {t(`subscription:features.${f}`)}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {canPay && (
                  <Button onClick={() => window.open("https://wa.me/996702928197", "_blank", "noopener,noreferrer")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("subscription:pay")} ${sub.priceUsd}
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                )}
                {sub.status === "ACTIVE" && (
                  <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                    {t("subscription:cancelAction")}
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm">
          {subQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-9 w-20 rounded" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ) : sub && !isCancelled ? (
            <>
              <div className="text-sm text-muted-foreground">
                {sub.status === "TRIAL"
                  ? t("subscription:untilTrialEnd")
                  : t("subscription:untilNextCharge")}
              </div>
              <div className="mt-1 text-3xl font-semibold text-foreground">
                {t("subscription:daysLeft", { count: Math.max(0, daysLeft) })}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${daysLeft <= 5 ? "bg-destructive" : daysLeft <= 10 ? "bg-warning" : "bg-primary"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {sub.nextBillingAt && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {t("subscription:dateLabel", { date: fmtDate(sub.nextBillingAt) })}
                </div>
              )}
              {sub.status === "TRIAL" && (
                <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  {t("subscription:graceNoticeHead")}{" "}
                  <span className="font-medium text-warning-foreground">
                    {t("subscription:graceNoticeLink")}
                  </span>{" "}
                  {t("subscription:graceNoticeTail")}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isCancelled ? t("subscription:cancelled") : t("subscription:noBillingDate")}
            </p>
          )}
        </div>
      </div>

      {/* ── Payment history ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">{t("subscription:historyTitle")}</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["date", "period", "amount", "provider", "reference", "status", "receipt"].map((h) => (
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
            {paymentsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {t("subscription:historyEmpty")}
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {fmtPeriod(p.periodStart, p.periodEnd)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">${p.amountUsd}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.provider}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {p.providerRef ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={t("subscription:downloadReceipt")}
                      disabled={
                        receiptMutation.isPending && receiptMutation.variables === p.id
                      }
                      onClick={() => receiptMutation.mutate(p.id)}
                    >
                      {receiptMutation.isPending && receiptMutation.variables === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" strokeWidth={1.5} />
                      )}
                      <span className="sr-only">{t("subscription:downloadReceipt")}</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Cancel AlertDialog ──────────────────────────────────────────────── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("subscription:cancelDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("subscription:cancelDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>{t("common:back")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending
                ? t("subscription:cancelDialog.pending")
                : t("subscription:cancelDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
