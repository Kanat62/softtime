import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, LogOut } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge, EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { queryKeys } from "@/shared/api/query-keys";
import { attendanceApi } from "@/entities/attendance/api";

// ─── WhoInOffice ─────────────────────────────────────────────────────────────

export function WhoInOffice() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.inOffice,
    queryFn: attendanceApi.inOffice,
    refetchInterval: 60_000,
  });

  const checkoutMut = useMutation({
    mutationFn: ({ attendanceId, time }: { attendanceId: string; time: string }) =>
      attendanceApi.manualCheckout(attendanceId, time),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inOffice });
      toast.success("Уход отмечен");
    },
    onError: () => toast.error("Не удалось отметить уход"),
  });

  function handleCheckout(attendanceId: string) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    checkoutMut.mutate({ attendanceId, time });
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Сейчас в офисе</h2>
          {!isLoading && !isError && (
            <p className="text-xs text-muted-foreground mt-0.5">
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
          {data?.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-8 w-8" />}
              title="Пока никто не в офисе"
              description="Сотрудники появятся здесь после отметки прихода"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data?.map((emp) => (
                <li key={emp.attendanceId} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{emp.fullName}</div>
                    <div className="text-xs text-muted-foreground">Пришёл в {emp.checkIn}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={checkoutMut.isPending}
                    onClick={() => handleCheckout(emp.attendanceId)}
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
