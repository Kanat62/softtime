import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { RotateCcw, Shield } from "lucide-react";
import { auditLogApi } from "@/entities/audit-log/api";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Вход в систему",
  APPROVE_REQUEST: "Одобрение заявки",
  REQUEST_APPROVED: "Одобрение заявки",
  REJECT_REQUEST: "Отклонение заявки",
  REQUEST_REJECTED: "Отклонение заявки",
  CREATE_SCHEDULE: "Создание расписания",
  UPDATE_SCHEDULE: "Изменение расписания",
  CREATE_EMPLOYEE: "Добавление сотрудника",
  UPDATE_EMPLOYEE: "Изменение сотрудника",
  BLOCK_EMPLOYEE: "Блокировка сотрудника",
  PUBLISH_NEWS: "Публикация новости",
  CREATE_NEWS: "Публикация новости",
  UPDATE_NETWORK: "Изменение сети",
  QR_REGENERATED: "Обновление QR-кода",
  REGENERATE_QR: "Обновление QR-кода",
  MANUAL_CHECKOUT: "Ручная отметка ухода",
  ATTENDANCE_MANUAL_FIX: "Ручная правка посещаемости",
  SETTINGS_UPDATED: "Изменение настроек",
};

const ACTION_OPTIONS = [
  { value: "_all", label: "Все действия" },
  { value: "LOGIN", label: "Вход в систему" },
  { value: "APPROVE_REQUEST", label: "Одобрение заявки" },
  { value: "REJECT_REQUEST", label: "Отклонение заявки" },
  { value: "CREATE_SCHEDULE", label: "Создание расписания" },
  { value: "UPDATE_SCHEDULE", label: "Изменение расписания" },
  { value: "CREATE_EMPLOYEE", label: "Добавление сотрудника" },
  { value: "UPDATE_EMPLOYEE", label: "Изменение сотрудника" },
  { value: "BLOCK_EMPLOYEE", label: "Блокировка сотрудника" },
  { value: "CREATE_NEWS", label: "Публикация новости" },
  { value: "QR_REGENERATED", label: "Обновление QR-кода" },
  { value: "ATTENDANCE_MANUAL_FIX", label: "Ручная правка посещаемости" },
  { value: "SETTINGS_UPDATED", label: "Изменение настроек" },
];

function fmtDateTime(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: ru });
  } catch {
    return iso;
  }
}

function actionTone(action: string): string {
  if (["BLOCK_EMPLOYEE", "REJECT_REQUEST", "REQUEST_REJECTED"].includes(action))
    return "text-destructive bg-destructive/10";
  if (["APPROVE_REQUEST", "REQUEST_APPROVED", "CREATE_EMPLOYEE", "PUBLISH_NEWS", "CREATE_NEWS"].includes(action))
    return "text-success bg-success/10";
  if (action === "LOGIN") return "text-muted-foreground bg-muted";
  return "text-primary bg-primary-light";
}

export function AuditTable() {
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [action, setAction] = useState("");

  const params = {
    page: page + 1,
    limit: PAGE_SIZE,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    action: action || undefined,
  };

  const logsQuery = useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => auditLogApi.list(params),
    placeholderData: (prev) => prev,
  });

  const logs = logsQuery.data?.data ?? [];
  const total = logsQuery.data?.meta.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  function handleReset() {
    setDateFrom("");
    setDateTo("");
    setAction("");
    setPage(0);
  }

  const hasFilters = dateFrom || dateTo || action;

  return (
    <div className="space-y-6">
      <PageHeader title="Аудит-лог" />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">С даты</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">По дату</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Тип действия</Label>
          <Select
            value={action || "_all"}
            onValueChange={(v) => {
              setAction(v === "_all" ? "" : v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-56 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 self-end text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Сбросить
          </Button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {logsQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => logsQuery.refetch()}
            >
              Повторить
            </Button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Действие", "Объект (тип)", "Субъект (ID)", "Дата и время"].map((h) => (
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
                {logsQuery.isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <Skeleton className="h-5 w-36 rounded-full" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-40 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-32 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-28 rounded" />
                        </td>
                      </tr>
                    ))
                  : logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionTone(log.action)}`}
                          >
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="font-mono text-xs">{log.entityType}</span>
                          {log.entityId && (
                            <span className="ml-1 text-xs text-muted-foreground/60">
                              #{log.entityId.slice(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {log.actorId.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {fmtDateTime(log.createdAt)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!logsQuery.isLoading && logs.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<Shield className="h-10 w-10" />}
                  title="Нет записей"
                  description="По выбранным фильтрам записей аудита не найдено."
                />
              </div>
            )}

            {!logsQuery.isLoading && total > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} из {total}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Вперёд
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
