import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { StatusBadge, EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { queryKeys } from "@/shared/api/query-keys";
import { attendanceApi } from "@/entities/attendance/api";
import { userApi } from "@/entities/user/api";

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "—";
  }
}

// ─── WhoInOffice ─────────────────────────────────────────────────────────────

export function WhoInOffice() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.inOffice,
    queryFn: attendanceApi.inOffice,
    refetchInterval: 60_000,
  });

  const empQuery = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 100 }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const empMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of empQuery.data?.data ?? []) m.set(e.id, e.fullName);
    return m;
  }, [empQuery.data]);

  const checkoutMut = useMutation({
    mutationFn: (id: string) =>
      attendanceApi.manualCheckout(id, new Date().toISOString()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inOffice });
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Уход отмечен");
    },
    onError: () => toast.error("Не удалось отметить уход"),
  });

  return (
    <div className="rounded-2xl bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Сейчас в офисе</h2>
          {!isLoading && !isError && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data?.length ?? 0} чел. на месте
            </p>
          )}
        </div>
        <StatusBadge status="PRESENT" />
      </div>

      {isLoading && (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="p-5">
          <ErrorState message="Не удалось загрузить список" onRetry={() => refetch()} />
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {(data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-8 w-8" />}
              title="Пока никто не в офисе"
              description="Сотрудники появятся здесь после отметки прихода"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data?.map((rec) => (
                <li key={rec.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {empMap.get(rec.userId) ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Пришёл в {fmtTime(rec.checkInAt)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={checkoutMut.isPending}
                    onClick={() => checkoutMut.mutate(rec.id)}
                  >
                    <LogOut className="h-3 w-3" />
                    Отметить уход
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
