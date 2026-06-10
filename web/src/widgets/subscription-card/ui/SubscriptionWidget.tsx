import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge, ErrorState, Skeleton } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { queryKeys } from "@/shared/api/query-keys";
import { subscriptionApi } from "@/entities/subscription/api";

export function SubscriptionWidget() {
  const qc = useQueryClient();
  const {
    data: sub,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: subscriptionApi.get,
  });

  const payMut = useMutation({
    mutationFn: subscriptionApi.pay,
    onSuccess: ({ checkoutUrl }) => {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      qc.invalidateQueries({ queryKey: queryKeys.subscription });
      toast.success("Перенаправляем на страницу оплаты…");
    },
    onError: () => toast.error("Не удалось инициировать оплату"),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-5 w-48" />
      </div>
    );
  }

  if (isError || !sub) {
    return <ErrorState message="Не удалось загрузить статус подписки" onRetry={() => refetch()} />;
  }

  const isCancelled = sub.status === "CANCELLED";
  const needsPay = ["TRIAL", "GRACE", "EXPIRED"].includes(sub.status);

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">Аккаунт приостановлен</p>
          <p className="text-xs text-muted-foreground mt-0.5">Обратитесь в службу поддержки.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-5 shadow-sm">
      <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Подписка
          </span>
          <StatusBadge status={sub.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">${sub.priceUsd}/мес</span>
          {sub.daysLeft > 0 ? (
            <>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              осталось{" "}
              <span className="font-semibold text-foreground">{sub.daysLeft} дн.</span>
            </>
          ) : sub.daysLeft === 0 ? (
            <>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span className="font-semibold text-destructive">срок истёк</span>
            </>
          ) : null}
        </p>
      </div>
      {needsPay && (
        <Button
          size="sm"
          className="shrink-0"
          disabled={payMut.isPending}
          onClick={() => payMut.mutate()}
        >
          {payMut.isPending ? "Перенаправление…" : "Оплатить"}
          {!payMut.isPending && <ExternalLink className="ml-1.5 h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}
