import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestStatus, RequestType } from "@softtime/shared";
import { toast } from "sonner";
import { format } from "date-fns";
import { dateFnsLocale } from "@/shared/lib/date-locale";
import { ClipboardList, RotateCcw } from "lucide-react";
import { requestApi } from "@/entities/request/api";
import type { AbsenceRequest } from "@/entities/request/model/types";
import { userApi } from "@/entities/user/api";
import { queryKeys } from "@/shared/api/query-keys";
import { isNormalizedError } from "@/shared/api/error";
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

// Подписи типов и статусов — из общего словаря enums, локальных карт нет.
const STATUS_OPTIONS: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
];

// Types that create absence days when approved
const ABSENCE_TYPES = new Set<RequestType>([
  RequestType.SICK,
  RequestType.FAMILY,
  RequestType.VACATION,
  RequestType.BUSINESS_TRIP,
  RequestType.REMOTE,
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: dateFnsLocale() });
  } catch {
    return iso;
  }
}

function fmtPeriod(start: string, end: string | null): string {
  try {
    if (!end || end === start) return fmtDate(start);
    return `${format(new Date(start), "d MMM", { locale: dateFnsLocale() })} – ${fmtDate(end)}`;
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

// ─── Approve context hint ─────────────────────────────────────────────────────

function ApproveHint({ type }: { type: RequestType }) {
  const { t } = useTranslation("requests");
  if (type === RequestType.EARLY_LEAVE) {
    return (
      <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
        {t("requests:hints.earlyLeave")}
      </p>
    );
  }
  if (ABSENCE_TYPES.has(type)) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        {t("requests:hints.absence")}
      </p>
    );
  }
  return null;
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function RequestsTable() {
  const { t } = useTranslation(["requests", "enums", "common"]);
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

  // Separate count query for the pending badge — always fetches status=PENDING
  const pendingCountQuery = useQuery({
    queryKey: queryKeys.requests({ page: 1, limit: 1, status: RequestStatus.PENDING }),
    queryFn: () => requestApi.list({ page: 1, limit: 1, status: RequestStatus.PENDING }),
    staleTime: 30_000,
  });
  const pendingCount = pendingCountQuery.data?.meta.total ?? 0;

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["requests"] });
  };

  // ── Mutations ────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => requestApi.approve(id),
    onSuccess: () => {
      toast.success(t("requests:toast.approved"));
      setActiveReq(null);
      setDecisionNote("");
      invalidate();
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : t("requests:toast.approveFailed");
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => requestApi.reject(id, note),
    onSuccess: () => {
      toast.success(t("requests:toast.rejected"));
      setActiveReq(null);
      setDecisionNote("");
      setConfirmReject(false);
      invalidate();
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : t("requests:toast.rejectFailed");
      toast.error(msg);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openSheet(req: AbsenceRequest) {
    setActiveReq(req);
    setDecisionNote("");
    setConfirmReject(false);
  }

  function handleApprove() {
    if (!activeReq) return;
    approveMutation.mutate({ id: activeReq.id });
  }

  function handleRejectConfirmed() {
    if (!activeReq) return;
    rejectMutation.mutate({ id: activeReq.id, note: decisionNote });
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const rows = reqQuery.data?.data ?? [];
  const total = reqQuery.data?.meta.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const columns: ColumnDef<AbsenceRequest>[] = [
    {
      id: "employee",
      header: t("common:employee"),
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
      header: t("common:type"),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {t(`enums:requestType.${row.original.type}`)}
        </span>
      ),
    },
    {
      id: "period",
      header: t("common:period"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {fmtPeriod(row.original.startDate, row.original.endDate)}
        </span>
      ),
    },
    {
      id: "status",
      header: t("common:status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      header: t("requests:columns.submitted"),
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
          {t("common:details")}
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("requests:title")}
        actions={
          pendingCount > 0 ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-2 text-xs font-semibold text-white">
              {pendingCount}
            </span>
          ) : undefined
        }
      />

      {/* ── Фильтр ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("common:status")}</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === "_all" ? "" : (v as RequestStatus));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-52 text-sm">
              <SelectValue placeholder={t("requests:allRequests")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t("requests:allRequests")}</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {t(`enums:requestStatus.${o}`)}
                  {o === RequestStatus.PENDING && pendingCount > 0 && (
                    <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-white">
                      {pendingCount}
                    </span>
                  )}
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
            {t("common:reset")}
          </Button>
        )}
      </div>

      {/* ── Таблица ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {reqQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("common:loadFailedShort")}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={invalidate}>
              {t("common:retry")}
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
                  title={t("requests:emptyTitle")}
                  description={t("requests:emptyDescription")}
                />
              </div>
            )}

            {!reqQuery.isLoading && total > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  {t("common:pagination.range", {
                    from: page * PAGE_SIZE + 1,
                    to: Math.min((page + 1) * PAGE_SIZE, total),
                    total,
                  })}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t("common:back")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("common:next")}
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
            <DialogTitle>{t("requests:dialog.title")}</DialogTitle>
            <DialogDescription>
              {activeReq && (empMap.get(activeReq.userId) ?? "—")}
            </DialogDescription>
          </DialogHeader>

          {activeReq && (
            <div className="flex flex-col gap-5">
              {/* Details block */}
              <div className="space-y-3 rounded-xl bg-muted/40 px-4 py-3">
                <DetailRow label={t("common:type")} value={t(`enums:requestType.${activeReq.type}`)} />
                <DetailRow
                  label={t("common:period")}
                  value={fmtPeriod(activeReq.startDate, activeReq.endDate)}
                />
                {activeReq.type === RequestType.EARLY_LEAVE && activeReq.desiredTime && (
                  <DetailRow label={t("requests:dialog.desiredTime")} value={activeReq.desiredTime} />
                )}
                <DetailRow label={t("common:comment")} value={activeReq.comment ?? "—"} />
                <DetailRow label={t("requests:columns.submitted")} value={fmtDate(activeReq.createdAt)} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("common:status")}</span>
                  <StatusBadge status={activeReq.status} />
                </div>
              </div>

              {/* Decision note (if already decided) */}
              {activeReq.status !== RequestStatus.PENDING && activeReq.decisionNote && (
                <div className="rounded-xl border border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">{t("requests:dialog.adminComment")}</p>
                  <p className="mt-1 text-sm text-foreground">{activeReq.decisionNote}</p>
                </div>
              )}

              {/* Comment field + action buttons (only for PENDING) */}
              {activeReq.status === RequestStatus.PENDING && (
                <>
                  {/* Contextual hint about what approval means */}
                  <ApproveHint type={activeReq.type} />

                  <div className="space-y-1.5">
                    <Label htmlFor="decision-note">{t("requests:dialog.decisionNote")}</Label>
                    <Textarea
                      id="decision-note"
                      placeholder={t("requests:dialog.decisionNotePlaceholder")}
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
                      {approveMutation.isPending ? t("common:saving") : t("requests:dialog.approve")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => setConfirmReject(true)}
                    >
                      {t("requests:dialog.reject")}
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
            <AlertDialogTitle>{t("requests:rejectDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("requests:rejectDialog.head")}{" "}
              <span className="font-medium text-foreground">
                {activeReq ? (empMap.get(activeReq.userId) ?? "—") : ""}
              </span>{" "}
              {t("requests:rejectDialog.tail")}
              {decisionNote ? t("requests:rejectDialog.withNote", { note: decisionNote }) : ""}
              {t("requests:rejectDialog.irreversible")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>{t("common:cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={rejectMutation.isPending}
              onClick={handleRejectConfirmed}
            >
              {rejectMutation.isPending
                ? t("requests:rejectDialog.pending")
                : t("requests:rejectDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
