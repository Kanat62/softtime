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
  // Сотрудники
  USER_APPROVED: "Сотрудник принят",
  USER_REJECTED: "Сотрудник отклонён",
  USER_DELETED: "Сотрудник удалён",
  USER_STATUS_CHANGED: "Изменён статус сотрудника",
  USER_NOTE_UPDATED: "Изменён комментарий к сотруднику",
  EMPLOYEE_SALARY_SET: "Установлен оклад сотруднику",
  // Заявки
  REQUEST_APPROVED: "Заявка одобрена",
  REQUEST_REJECTED: "Заявка отклонена",
  // Расписание
  SCHEDULE_UPDATED: "Изменено расписание",
  SCHEDULE_APPLY_ALL: "Расписание применено ко всем",
  // Посещаемость
  ATTENDANCE_MANUAL_CREATE: "Посещаемость добавлена вручную",
  ATTENDANCE_MANUAL_EDIT: "Посещаемость изменена вручную",
  // Офисные сети / QR
  OFFICE_NETWORK_CREATED: "Добавлена офисная сеть",
  OFFICE_NETWORK_UPDATED: "Изменена офисная сеть",
  OFFICE_NETWORK_DELETED: "Удалена офисная сеть",
  QR_REGENERATED: "Обновлён QR-код",
  // Новости
  NEWS_CREATED: "Опубликована новость",
  NEWS_DELETED: "Новость удалена",
  // Компания / настройки / подписка
  UPDATE_COMPANY_REQUISITES: "Изменены реквизиты компании",
  COMPANY_ACTIVATED: "Компания активирована",
  COMPANY_SUSPENDED: "Компания приостановлена",
  SETTINGS_UPDATED: "Изменены настройки",
  SUBSCRIPTION_CANCELLED: "Подписка отменена",
};

const ACTION_OPTIONS = [
  { value: "_all", label: "Все действия" },
  ...Object.entries(ACTION_LABELS)
    .filter(([value]) => value !== "LOGIN")
    .map(([value, label]) => ({ value, label })),
];

const ENTITY_LABELS: Record<string, string> = {
  Company: "Компания",
  EmployeeSchedule: "Расписание",
  News: "Новость",
  OfficeNetwork: "Офисная сеть",
  QrToken: "QR-код",
  User: "Сотрудник",
};

function fmtDateTime(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: ru });
  } catch {
    return iso;
  }
}

const DESTRUCTIVE_ACTIONS = [
  "USER_REJECTED",
  "USER_DELETED",
  "USER_STATUS_CHANGED",
  "REQUEST_REJECTED",
  "OFFICE_NETWORK_DELETED",
  "NEWS_DELETED",
  "COMPANY_SUSPENDED",
  "SUBSCRIPTION_CANCELLED",
];
const SUCCESS_ACTIONS = [
  "USER_APPROVED",
  "REQUEST_APPROVED",
  "NEWS_CREATED",
  "OFFICE_NETWORK_CREATED",
  "COMPANY_ACTIVATED",
];

function actionTone(action: string): string {
  if (DESTRUCTIVE_ACTIONS.includes(action)) return "text-destructive bg-destructive/10";
  if (SUCCESS_ACTIONS.includes(action)) return "text-success bg-success/10";
  if (action === "LOGIN") return "text-muted-foreground bg-muted";
  return "text-primary bg-primary-light";
}

export function AuditTable() {
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [action, setAction] = useState("");

  // Date inputs are calendar dates ("YYYY-MM-DD"). Expand them to full local-day
  // bounds so the range is inclusive: `from` = start of day, `to` = end of day.
  // Without this, `to` would be parsed as midnight and exclude the whole day.
  const params = {
    page: page + 1,
    limit: PAGE_SIZE,
    from: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
    to: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined,
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
                          <span className="text-sm">
                            {ENTITY_LABELS[log.entityType] ?? log.entityType}
                          </span>
                          {log.entityId && (
                            <span className="ml-1 font-mono text-xs text-muted-foreground/60">
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
