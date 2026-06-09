import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestStatus, RequestType } from "@softtime/shared";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ClipboardList, RotateCcw } from "lucide-react";
import { requestApi } from "@/entities/request/api";
import type { AbsenceRequest } from "@/entities/request/model/types";
import { userApi } from "@/entities/user/api";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState, StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<RequestType, string> = {
  [RequestType.SICK]: "Больничный",
  [RequestType.FAMILY]: "Семейные обстоятельства",
  [RequestType.VACATION]: "Отпуск",
  [RequestType.BUSINESS_TRIP]: "Командировка",
  [RequestType.REMOTE]: "Удалённая работа",
  [RequestType.LATE_REASON]: "Опоздание (с причиной)",
  [RequestType.EARLY_LEAVE]: "Ранний уход (с причиной)",
  [RequestType.OTHER]: "Другое",
};

const STATUS_OPTIONS: { label: string; value: RequestStatus | "" }[] = [
  { label: "Все заявки", value: "" },
  { label: "На рассмотрении", value: RequestStatus.PENDING },
  { label: "Одобрено", value: RequestStatus.APPROVED },
  { label: "Отклонено", value: RequestStatus.REJECTED },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

function fmtPeriod(start: string, end: string | null): string {
  try {
    if (!end || end === start) return fmtDate(start);
    return `${format(new Date(start), "d MMM", { locale: ru })} – ${fmtDate(end)}`;
  } catch {
    return start;
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function RequestsTable() {
  const qc = useQueryClient();

  // ── Filter / pagination state ────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");

  // ── Sheet / dialog state ─────────────────────────────────────────────────
  const [activeReq, setActiveReq] = useState<AbsenceRequest | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const params = {
    page: page + 1,
    limit: PAGE_SIZE,
    status: statusFilter || undefined,
  };

  const reqQuery = useQuery({
    queryKey: queryKeys.requests(params),
    queryFn: () => requestApi.list(params),
    placeholderData: (prev) => prev,
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

  const invalidate = () => qc.invalidateQueries({ queryKey: ["requests"] });

  // ── Mutations ────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      requestApi.approve(id, note || undefined),
    onSuccess: () => {
      toast.success("Заявка одобрена");
      setActiveReq(null);
      setDecisionNote("");
      invalidate();
    },
    onError: () => toast.error("Ошибка при одобрении"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => requestApi.reject(id, note),
    onSuccess: () => {
      toast.success("Заявка отклонена");
      setActiveReq(null);
      setDecisionNote("");
      setConfirmReject(false);
      invalidate();
    },
    onError: () => toast.error("Ошибка при отклонении"),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openSheet(req: AbsenceRequest) {
    setActiveReq(req);
    setDecisionNote("");
    setConfirmReject(false);
  }

  function handleApprove() {
    if (!activeReq) return;
    approveMutation.mutate({ id: activeReq.id, note: decisionNote });
  }

  function handleRejectConfirmed() {
    if (!activeReq) return;
    rejectMutation.mutate({ id: activeReq.id, note: decisionNote });
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const rows = reqQuery.data?.data ?? [];
  const total = reqQuery.data?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const columns: ColumnDef<AbsenceRequest>[] = [
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
      id: "type",
      header: "Тип",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {TYPE_LABEL[row.original.type] ?? row.original.type}
        </span>
      ),
    },
    {
      id: "period",
      header: "Период",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {fmtPeriod(row.original.startDate, row.original.endDate)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      header: "Подано",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{fmtDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => openSheet(row.original)}
        >
          Детали
        </Button>
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

  // ── Pending count badge ───────────────────────────────────────────────────
  const pendingCount = useMemo(
    () => (reqQuery.data?.data ?? []).filter((r) => r.status === RequestStatus.PENDING).length,
    [reqQuery.data],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader title="Заявки" />

      {/* ── Фильтр ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Статус</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === "_all" ? "" : (v as RequestStatus));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-52 text-sm">
              <SelectValue placeholder="Все заявки" />
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

        {statusFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 self-end text-muted-foreground"
            onClick={() => {
              setStatusFilter("");
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
        {reqQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={invalidate}>
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
                {reqQuery.isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-3.5 w-28 rounded" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-28 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-32 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-20 rounded" />
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                        onClick={() => openSheet(row.original)}
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

            {!reqQuery.isLoading && rows.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<ClipboardList className="h-10 w-10" />}
                  title="Заявок нет"
                  description="По выбранным фильтрам заявок не найдено."
                />
              </div>
            )}

            {!reqQuery.isLoading && total > 0 && (
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

      {/* ── Dialog: Заявка сотрудника ────────────────────────────────────── */}
      <Dialog open={!!activeReq} onOpenChange={(open) => !open && setActiveReq(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Заявка сотрудника</DialogTitle>
            <DialogDescription>
              {activeReq && (empMap.get(activeReq.userId) ?? "—")}
            </DialogDescription>
          </DialogHeader>

          {activeReq && (
            <div className="flex flex-col gap-5">
              {/* Details block */}
              <div className="space-y-3 rounded-xl bg-muted/40 px-4 py-3">
                <DetailRow label="Тип" value={TYPE_LABEL[activeReq.type] ?? activeReq.type} />
                <DetailRow
                  label="Период"
                  value={fmtPeriod(activeReq.startDate, activeReq.endDate)}
                />
                <DetailRow label="Комментарий" value={activeReq.comment ?? "—"} />
                <DetailRow label="Подано" value={fmtDate(activeReq.createdAt)} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Статус</span>
                  <StatusBadge status={activeReq.status} />
                </div>
              </div>

              {/* Decision note (if already decided) */}
              {activeReq.status !== RequestStatus.PENDING && activeReq.decisionNote && (
                <div className="rounded-xl border border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">Комментарий администратора</p>
                  <p className="mt-1 text-sm text-foreground">{activeReq.decisionNote}</p>
                </div>
              )}

              {/* Comment field + action buttons (only for PENDING) */}
              {activeReq.status === RequestStatus.PENDING && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="decision-note">Комментарий к решению</Label>
                    <Textarea
                      id="decision-note"
                      placeholder="Необязательно..."
                      rows={3}
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="flex gap-2 sm:flex-row">
                    <Button
                      className="flex-1 bg-success text-white hover:bg-success/90"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={handleApprove}
                    >
                      {approveMutation.isPending ? "Сохраняем..." : "Одобрить"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => setConfirmReject(true)}
                    >
                      Отклонить
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Подтверждение отклонения ────────────────────────── */}
      <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Заявка сотрудника{" "}
              <span className="font-medium text-foreground">
                {activeReq ? (empMap.get(activeReq.userId) ?? "—") : ""}
              </span>{" "}
              будет отклонена
              {decisionNote ? ` с комментарием: «${decisionNote}»` : ""}. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={rejectMutation.isPending}
              onClick={handleRejectConfirmed}
            >
              {rejectMutation.isPending ? "Отклоняем..." : "Да, отклонить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
