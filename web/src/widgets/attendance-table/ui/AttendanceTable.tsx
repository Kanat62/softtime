import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DayStatus } from "@softtime/shared";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PenLine, Plus, RotateCcw, ClipboardX, Trash2 } from "lucide-react";
import { attendanceApi } from "@/entities/attendance/api";
import type { AttendanceRow } from "@/entities/attendance/model/types";
import { userApi } from "@/entities/user/api";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState, StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useFixAttendance } from "@/features/attendance/fix-attendance";
import { useAddAbsence } from "@/features/attendance/add-absence";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const today = new Date().toISOString().slice(0, 10);
const weekAgo = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
})();

const STATUS_OPTIONS: { label: string; value: DayStatus | "" }[] = [
  { label: "Все статусы", value: "" },
  { label: "В офисе", value: DayStatus.PRESENT },
  { label: "Опоздание", value: DayStatus.LATE },
  { label: "Отсутствует", value: DayStatus.ABSENT },
  { label: "Не завершён", value: DayStatus.INCOMPLETE },
  { label: "Согласованное отсутствие", value: DayStatus.APPROVED_ABSENCE },
  { label: "Ручная правка", value: DayStatus.MANUAL },
  { label: "Ранний уход", value: DayStatus.EARLY_LEAVE },
  { label: "Сверхурочно", value: DayStatus.OVERTIME },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

/** Format ISO datetime → "HH:mm" in local time, or "—" */
function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "—";
  }
}

/** Extract "HH:mm" from ISO for <input type="time"> initialisation */
function isoToTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "";
  }
}

/** Convert date "YYYY-MM-DD" + time input "HH:mm" → ISO datetime string */
function toISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function fmtMinutes(min: number | null): string {
  if (min === null || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ─── Edit sheet state ─────────────────────────────────────────────────────────

interface EditState {
  checkIn: string;  // "HH:mm" for <input type="time">
  checkOut: string; // "HH:mm" for <input type="time">
  note: string;
}

// ─── Today stat card ─────────────────────────────────────────────────────────

function TodayStatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="rounded-2xl bg-card px-5 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function AttendanceTable() {
  const qc = useQueryClient();

  // ── Filter state ────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DayStatus | "">("");

  // ── Sheet state ─────────────────────────────────────────────────────────
  const [editRow, setEditRow] = useState<AttendanceRow | null>(null);
  const [editState, setEditState] = useState<EditState>({ checkIn: "", checkOut: "", note: "" });
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [absenceState, setAbsenceState] = useState({
    userId: "",
    date: today,
    status: DayStatus.ABSENT as DayStatus,
    note: "",
  });

  // ── Queries ─────────────────────────────────────────────────────────────
  const attParams = {
    page: page + 1,
    limit: PAGE_SIZE,
    from: dateFrom,
    to: dateTo,
    userId: userIdFilter || undefined,
    status: statusFilter || undefined,
  };

  const attQuery = useQuery({
    queryKey: queryKeys.attendance(attParams),
    queryFn: () => attendanceApi.list(attParams),
    placeholderData: (prev) => prev,
  });

  const todayQuery = useQuery({
    queryKey: queryKeys.attendance({ from: today, to: today, limit: 200, page: 1 }),
    queryFn: () => attendanceApi.list({ from: today, to: today, limit: 200, page: 1 }),
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

  // ── Feature mutations ────────────────────────────────────────────────────
  const patchMutation = useFixAttendance(() => setEditRow(null));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attendanceApi.deleteRecord(id),
    onSuccess: () => {
      setDeleteRowId(null);
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  const absenceMutation = useAddAbsence(() => {
    setAbsenceOpen(false);
    setAbsenceState({ userId: "", date: today, status: DayStatus.ABSENT, note: "" });
  });

  // ── Open edit sheet ──────────────────────────────────────────────────────
  function openEdit(row: AttendanceRow) {
    setEditRow(row);
    setEditState({
      checkIn: isoToTimeInput(row.checkInAt),
      checkOut: isoToTimeInput(row.checkOutAt),
      note: row.note ?? "",
    });
  }

  function saveEdit() {
    if (!editRow) return;
    patchMutation.mutate({
      id: editRow.id,
      dto: {
        checkInAt: editState.checkIn ? toISO(editRow.date, editState.checkIn) : null,
        checkOutAt: editState.checkOut ? toISO(editRow.date, editState.checkOut) : null,
        note: editState.note || null,
      },
    });
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const rows = attQuery.data?.data ?? [];
  const total = attQuery.data?.meta.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const columns: ColumnDef<AttendanceRow>[] = [
    {
      id: "employee",
      header: "Сотрудник",
      cell: ({ row }) => {
        const name = empMap.get(row.original.userId) ?? "—";
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-semibold text-primary">
              {initials(name)}
            </div>
            <span className="text-sm font-medium text-foreground">{name}</span>
          </div>
        );
      },
    },
    {
      id: "date",
      header: "Дата",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{fmtDate(row.original.date)}</span>
      ),
    },
    {
      id: "checkIn",
      header: "Приход",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-foreground">{fmtTime(row.original.checkInAt)}</span>
      ),
    },
    {
      id: "checkOut",
      header: "Уход",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-foreground">{fmtTime(row.original.checkOutAt)}</span>
      ),
    },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={row.original.status} />
          {row.original.isManual && (
            <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ручн.
            </span>
          )}
        </div>
      ),
    },
    {
      id: "worked",
      header: "Отработано",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {fmtMinutes(row.original.workedMinutes)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => openEdit(row.original)}
            title="Исправить запись"
          >
            <PenLine className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteRowId(row.original.id)}
            title="Удалить запись"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    state: { pagination: { pageIndex: page, pageSize: PAGE_SIZE } },
    onPaginationChange: (upd) => {
      const next = typeof upd === "function" ? upd({ pageIndex: page, pageSize: PAGE_SIZE }) : upd;
      setPage(next.pageIndex);
    },
  });

  // ── Render ────────────────────────────────────────────────────────────────
  const todayRecords = todayQuery.data?.data ?? [];
  const todayStats = {
    onTime: todayRecords.filter((r) => r.status === DayStatus.PRESENT).length,
    late: todayRecords.filter((r) => r.status === DayStatus.LATE).length,
    absent: todayRecords.filter(
      (r) => r.status === DayStatus.ABSENT || r.status === DayStatus.APPROVED_ABSENCE,
    ).length,
    incomplete: todayRecords.filter((r) => r.status === DayStatus.INCOMPLETE).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Посещаемость"
        actions={
          <Button size="sm" onClick={() => setAbsenceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Добавить отсутствие
          </Button>
        }
      />

      {/* ── Статистика сегодня ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {todayQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <TodayStatCard label="ВОВРЕМЯ" value={todayStats.onTime} valueClass="text-success" />
            <TodayStatCard
              label="ОПОЗДАНИЯ"
              value={todayStats.late}
              valueClass="text-warning-foreground"
            />
            <TodayStatCard
              label="ОТСУТСТВУЮТ"
              value={todayStats.absent}
              valueClass="text-destructive"
            />
            <TodayStatCard
              label="НЕ ЗАВЕРШЁН"
              value={todayStats.incomplete}
              valueClass="text-slate-600"
            />
          </>
        )}
      </div>

      {/* ── Фильтры ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">От</Label>
          <Input
            type="date"
            className="h-8 w-38 text-sm"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">До</Label>
          <Input
            type="date"
            className="h-8 w-38 text-sm"
            value={dateTo}
            min={dateFrom}
            max={today}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Сотрудник</Label>
          <Select
            value={userIdFilter}
            onValueChange={(v) => {
              setUserIdFilter(v === "_all" ? "" : v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder="Все сотрудники" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Все сотрудники</SelectItem>
              {(empQuery.data?.data ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Статус</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === "_all" ? "" : (v as DayStatus));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-52 text-sm">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value || "_all"} value={o.value || "_all"}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(userIdFilter || statusFilter || dateFrom !== weekAgo || dateTo !== today) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 self-end text-muted-foreground"
            onClick={() => {
              setUserIdFilter("");
              setStatusFilter("");
              setDateFrom(weekAgo);
              setDateTo(today);
              setPage(0);
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            Сбросить
          </Button>
        )}
      </div>

      {/* ── Таблица ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {attQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => qc.invalidateQueries({ queryKey: ["attendance"] })}
            >
              Повторить
            </Button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {table.getHeaderGroups().map((hg) =>
                    hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {attQuery.isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-3.5 w-32 rounded" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-24 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-12 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-12 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-16 rounded" />
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>

            {!attQuery.isLoading && rows.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<ClipboardX className="h-10 w-10" />}
                  title="Записей нет"
                  description="По выбранным фильтрам данных не найдено."
                />
              </div>
            )}

            {!attQuery.isLoading && total > 0 && (
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

      {/* ── Dialog: Правка записи ────────────────────────────────────────── */}
      <Dialog open={!!editRow} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Правка записи</DialogTitle>
            <DialogDescription>
              {editRow && `${empMap.get(editRow.userId) ?? "—"} · ${fmtDate(editRow.date)}`}
            </DialogDescription>
          </DialogHeader>

          {editRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-checkin">Приход</Label>
                  <Input
                    id="edit-checkin"
                    type="time"
                    value={editState.checkIn}
                    onChange={(e) => setEditState((s) => ({ ...s, checkIn: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-checkout">Уход</Label>
                  <Input
                    id="edit-checkout"
                    type="time"
                    value={editState.checkOut}
                    onChange={(e) => setEditState((s) => ({ ...s, checkOut: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-note">Комментарий</Label>
                <Textarea
                  id="edit-note"
                  placeholder="Причина правки..."
                  rows={3}
                  value={editState.note}
                  onChange={(e) => setEditState((s) => ({ ...s, note: e.target.value }))}
                />
              </div>

              <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                Запись будет помечена как <strong>ручная правка</strong> и залогирована в аудит-лог.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button className="w-full" disabled={patchMutation.isPending} onClick={saveEdit}>
              {patchMutation.isPending ? "Сохраняем..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Удалить запись ───────────────────────────────────────── */}
      <Dialog open={!!deleteRowId} onOpenChange={(open) => !open && setDeleteRowId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить запись?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Запись о посещаемости будет удалена безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteRowId(null)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deleteRowId && deleteMutation.mutate(deleteRowId)}
            >
              {deleteMutation.isPending ? "Удаляем..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Добавить отсутствие ───────────────────────────────────── */}
      <Dialog open={absenceOpen} onOpenChange={(open) => !open && setAbsenceOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Добавить запись об отсутствии</DialogTitle>
            <DialogDescription>
              Запись будет помечена как ручная и отражена в посещаемости.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Сотрудник</Label>
              <Select
                value={absenceState.userId}
                onValueChange={(v) => setAbsenceState((s) => ({ ...s, userId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите сотрудника" />
                </SelectTrigger>
                <SelectContent>
                  {(empQuery.data?.data ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="abs-date">Дата</Label>
              <Input
                id="abs-date"
                type="date"
                max={today}
                value={absenceState.date}
                onChange={(e) => setAbsenceState((s) => ({ ...s, date: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select
                value={absenceState.status}
                onValueChange={(v) => setAbsenceState((s) => ({ ...s, status: v as DayStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DayStatus.ABSENT}>Отсутствует (без причины)</SelectItem>
                  <SelectItem value={DayStatus.APPROVED_ABSENCE}>
                    Согласованное отсутствие
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="abs-note">Причина / комментарий</Label>
              <Textarea
                id="abs-note"
                placeholder="Например: больничный, отпуск за свой счёт..."
                rows={3}
                value={absenceState.note}
                onChange={(e) => setAbsenceState((s) => ({ ...s, note: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={
                absenceMutation.isPending || !absenceState.userId || !absenceState.note.trim()
              }
              onClick={() =>
                absenceMutation.mutate({
                  userId: absenceState.userId,
                  date: absenceState.date,
                  status: absenceState.status,
                  note: absenceState.note,
                })
              }
            >
              {absenceMutation.isPending ? "Сохраняем..." : "Добавить запись"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
