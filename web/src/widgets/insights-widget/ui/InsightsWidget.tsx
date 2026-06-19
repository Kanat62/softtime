import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import axios from "axios";

import { Skeleton, EmptyState, ErrorState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { queryKeys } from "@/shared/api/query-keys";
import { insightApi } from "@/entities/insight/api";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-4 h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

// ─── Insight body ─────────────────────────────────────────────────────────────

function InsightBody({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 p-5 pb-4">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={
            i === 0
              ? "text-sm font-semibold leading-relaxed text-foreground"
              : "text-sm leading-relaxed text-muted-foreground"
          }
        >
          {p}
        </p>
      ))}
    </div>
  );
}

// ─── InsightsWidget ───────────────────────────────────────────────────────────

export function InsightsWidget() {
  const qc = useQueryClient();
  const autoTriggered = useRef(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.insight,
    queryFn: insightApi.get,
    retry: (failCount, err) => {
      if (axios.isAxiosError(err) && err.response?.status === 404) return false;
      return failCount < 2;
    },
    staleTime: 20 * 60_000,
  });

  const regenMut = useMutation({
    mutationFn: insightApi.regenerate,
    onSuccess: (fresh) => {
      qc.setQueryData(queryKeys.insight, fresh);
      toast.success("Аналитика обновлена");
    },
    onError: () => toast.error("Не удалось обновить аналитику"),
  });

  const is404 =
    isError && axios.isAxiosError(error) && error.response?.status === 404;

  // Auto-generate on first open if no insight exists yet
  useEffect(() => {
    if (is404 && !autoTriggered.current && !regenMut.isPending) {
      autoTriggered.current = true;
      regenMut.mutate();
    }
  }, [is404, regenMut]);

  const fmtDate = (iso: string) => {
    try {
      return format(new Date(iso), "d MMMM, HH:mm", { locale: ru });
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">AI‑аналитика посещаемости</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={regenMut.isPending || isLoading}
          onClick={() => regenMut.mutate()}
        >
          <RefreshCw className={`h-3 w-3 ${regenMut.isPending ? "animate-spin" : ""}`} />
          {regenMut.isPending ? "Обновляю…" : "Обновить"}
        </Button>
      </div>

      {/* Body */}
      {(isLoading || (is404 && regenMut.isPending)) && <InsightSkeleton />}

      {!isLoading && isError && !is404 && (
        <div className="p-5">
          <ErrorState
            message="Не удалось загрузить аналитику"
            onRetry={() => refetch()}
          />
        </div>
      )}

      {/* 404 and auto-generation failed — show manual button */}
      {is404 && !regenMut.isPending && regenMut.isError && (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="Не удалось сгенерировать аналитику"
          description="Проверьте, что OPENAI_API_KEY настроен и данные посещаемости есть в системе."
          action={
            <Button size="sm" onClick={() => regenMut.mutate()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Попробовать снова
            </Button>
          }
        />
      )}

      {/* Not enough data */}
      {!isLoading && data && !data.isEnough && (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="Данных пока недостаточно"
          description="Инсайт появится, когда система накопит данные по посещаемости за несколько недель. Обычно это занимает 1–2 недели."
        />
      )}

      {/* Success */}
      {!isLoading && data && data.isEnough && (
        <InsightBody text={data.insight} />
      )}

      {/* Footer timestamp */}
      {!isLoading && data && (
        <div className="flex items-center gap-1.5 border-t border-border px-5 py-3">
          <Clock className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground/60">
            Обновлено {fmtDate(data.generatedAt)}
          </span>
        </div>
      )}
    </div>
  );
}
