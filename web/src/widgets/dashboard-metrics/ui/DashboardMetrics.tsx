import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Clock, Inbox } from "lucide-react";
import { UserStatus, RequestStatus } from "@softtime/shared";

import { Skeleton } from "@/shared/ui";
import { queryKeys } from "@/shared/api/query-keys";
import { attendanceApi } from "@/entities/attendance/api";
import { userApi } from "@/entities/user/api";
import { requestApi } from "@/entities/request/api";

// ─── MetricCard ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-9 w-16" />
      ) : (
        <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
      )}
    </div>
  );
}

// ─── DashboardMetrics ────────────────────────────────────────────────────────

export function DashboardMetrics() {
  const totalQ = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 1 }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 1 }),
  });

  const pendingEmpQ = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 1, status: UserStatus.PENDING }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 1, status: UserStatus.PENDING }),
  });

  const inOfficeCountQ = useQuery({
    queryKey: queryKeys.inOffice,
    queryFn: attendanceApi.inOffice,
    refetchInterval: 60_000,
  });

  const pendingReqQ = useQuery({
    queryKey: queryKeys.requests({ page: 1, limit: 1, status: RequestStatus.PENDING }),
    queryFn: () => requestApi.list({ page: 1, limit: 1, status: RequestStatus.PENDING }),
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Сотрудников всего"
        value={totalQ.data?.total ?? 0}
        icon={Users}
        loading={totalQ.isLoading}
      />
      <MetricCard
        label="Сейчас в офисе"
        value={inOfficeCountQ.data?.length ?? 0}
        icon={UserCheck}
        loading={inOfficeCountQ.isLoading}
      />
      <MetricCard
        label="Ожидают подтверждения"
        value={pendingEmpQ.data?.total ?? 0}
        icon={Clock}
        loading={pendingEmpQ.isLoading}
      />
      <MetricCard
        label="Новых заявок"
        value={pendingReqQ.data?.total ?? 0}
        icon={Inbox}
        loading={pendingReqQ.isLoading}
      />
    </div>
  );
}
