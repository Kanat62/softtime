import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";

import { StatusBadge, ErrorState, Skeleton } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { queryKeys } from "@/shared/api/query-keys";
import { subscriptionApi } from "@/entities/subscription/api";

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return differenceInDays(parseISO(dateStr), new Date());
}

// ─── SubscriptionWidget ───────────────────────────────────────────────────────

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscription });
      toast.success("Подписка активирована");
    },
    onError: () => toast.error("Не удалось оплатить подписку"),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-5 w-48" />
      </div>
    );
  }

  if (isError || !sub) {
    return <ErrorState message="Не удалось загрузить статус подписки" onRetry={() => refetch()} />;
  }

  const days = daysUntil(sub.nextBillingDate);
  const needsPay = sub.status === "TRIAL" || sub.status === "GRACE" || sub.status === "SUSPENDED";

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm flex flex-wrap items-center gap-4">
      <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Подписка
          </span>
          <StatusBadge status={sub.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Тариф <span className="font-semibold text-foreground">${sub.amount}/мес</span>
          {days !== null && (
            <>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              {days > 0 ? (
                <>
                  осталось <span className="font-semibold text-foreground">{days} дн.</span>
                </>
              ) : (
                <span className="font-semibold text-destructive">срок истёк</span>
              )}
            </>
          )}
        </p>
      </div>
      {needsPay && (
        <Button
          size="sm"
          className="shrink-0"
          disabled={payMut.isPending}
          onClick={() => payMut.mutate()}
        >
          {payMut.isPending ? "Оплата…" : "Оплатить"}
        </Button>
      )}
    </div>
  );
}
