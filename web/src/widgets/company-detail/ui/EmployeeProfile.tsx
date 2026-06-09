import { useState, type ReactNode } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestType } from "@softtime/shared";
import { toast } from "sonner";
import { ChevronLeft, Clock, FileText, Save } from "lucide-react";
import { userApi } from "@/entities/user/api";
import { attendanceApi } from "@/entities/attendance/api";
import { requestApi } from "@/entities/request/api";
import type { AttendanceRow } from "@/entities/attendance/model/types";
import type { AbsenceRequest } from "@/entities/request/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { StatusBadge, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return "—";
  }
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "—";
  }
}

function fmtMinutes(min: number | null | undefined): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}ч ${m.toString().padStart(2, "0")}м`;
}

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.SICK]: "Больничный",
  [RequestType.FAMILY]: "Семейные обстоятельства",
  [RequestType.VACATION]: "Отпуск",
  [RequestType.BUSINESS_TRIP]: "Командировка",
  [RequestType.REMOTE]: "Удалённая работа",
  [RequestType.LATE_REASON]: "Опоздание",
  [RequestType.EARLY_LEAVE]: "Ранний уход",
  [RequestType.OTHER]: "Другое",
};

// ─── Component ──────────────────────────────────────────────────────────────

export function EmployeeProfile() {
  const { id } = useParams({ from: "/admin/employees/$id" });
  const qc = useQueryClient();

  const [attPage, setAttPage] = useState(0);
  const [reqPage, setReqPage] = useState(0);
  const [note, setNote] = useState<string | undefined>(undefined);
  const [noteDirty, setNoteDirty] = useState(false);

  const ATT_LIMIT = 10;
  const REQ_LIMIT = 10;

  // ─── Queries ───────────────────────────────────────────────────────────

  const { data: employee, isLoading: empLoading } = useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: () => userApi.getEmployee(id),
    enabled: !!id,
  });

  // initialise note state from loaded data
  const resolvedNote = note ?? employee?.adminNote ?? "";

  const attParams = { userId: id, page: attPage + 1, limit: ATT_LIMIT };
  const { data: attData, isLoading: attLoading } = useQuery({
    queryKey: queryKeys.attendance(attParams),
    queryFn: () => attendanceApi.list(attParams),
    enabled: !!id,
  });

  const reqParams = { userId: id, page: reqPage + 1, limit: REQ_LIMIT };
  const { data: reqData, isLoading: reqLoading } = useQuery({
    queryKey: queryKeys.requests(reqParams),
    queryFn: () => requestApi.list(reqParams),
    enabled: !!id,
  });

  // ─── Mutation: save admin note ─────────────────────────────────────────

  const noteMutation = useMutation({
    mutationFn: (n: string) => userApi.updateNote(id, n),
    onSuccess: () => {
      toast.success("Комментарий сохранён");
      setNoteDirty(false);
      qc.invalidateQueries({ queryKey: queryKeys.employee(id) });
    },
    onError: () => toast.error("Не удалось сохранить комментарий"),
  });

  // ─── Attendance table ──────────────────────────────────────────────────

  const attColumns: ColumnDef<AttendanceRow>[] = [
    {
      id: "date",
      header: "Дата",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{fmt(row.original.date)}</span>
      ),
    },
    {
      id: "checkIn",
      header: "Приход",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{fmtTime(row.original.checkIn)}</span>
      ),
    },
    {
      id: "checkOut",
      header: "Уход",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{fmtTime(row.original.checkOut)}</span>
      ),
    },
    {
      id: "status",
      header: "Статус дня",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "worked",
      header: "Отработано",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {fmtMinutes(row.original.workedMinutes)}
        </span>
      ),
    },
  ];

  const attTable = useReactTable({
    data: attData?.data ?? [],
    columns: attColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((attData?.total ?? 0) / ATT_LIMIT),
  });

  // ─── Requests table ────────────────────────────────────────────────────

  const reqColumns: ColumnDef<AbsenceRequest>[] = [
    {
      id: "type",
      header: "Тип",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {REQUEST_TYPE_LABELS[row.original.type as RequestType] ?? row.original.type}
        </span>
      ),
    },
    {
      id: "period",
      header: "Период",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {fmt(r.startDate)}
            {r.endDate && r.endDate !== r.startDate ? ` — ${fmt(r.endDate)}` : ""}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      header: "Подана",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{fmt(row.original.createdAt)}</span>
      ),
    },
  ];

  const reqTable = useReactTable({
    data: reqData?.data ?? [],
    columns: reqColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((reqData?.total ?? 0) / REQ_LIMIT),
  });

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          to="/admin/employees"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          Сотрудники
        </Link>

        {empLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-base font-semibold text-primary">
                {employee?.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {employee?.fullName}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{employee?.email}</p>
              </div>
            </div>
            {employee && <StatusBadge status={employee.status} />}
          </div>
        )}
      </div>

      {/* Info cards */}
      {empLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : employee ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCard label="Дата найма" value={fmt(employee.hiredAt)} />
          <InfoCard label="Последняя активность" value={fmt(employee.lastActivityAt)} />
          <InfoCard label="Статус" value={<StatusBadge status={employee.status} />} />
          <InfoCard label="Email" value={employee.email} />
        </div>
      ) : null}

      {/* ── Attendance history ─────────────────────────────────────────── */}
      <Section icon={<Clock className="h-5 w-5" strokeWidth={1.5} />} title="История посещаемости">
        <PaginatedTable
          table={attTable}
          isLoading={attLoading}
          total={attData?.total ?? 0}
          page={attPage}
          limit={ATT_LIMIT}
          onPageChange={setAttPage}
          skeletonCols={5}
          empty={
            <EmptyState
              icon={<Clock className="h-8 w-8" />}
              title="Нет записей"
              description="История посещаемости появится после первого прихода сотрудника."
            />
          }
        />
      </Section>

      {/* ── Requests ──────────────────────────────────────────────────── */}
      <Section icon={<FileText className="h-5 w-5" strokeWidth={1.5} />} title="Заявки">
        <PaginatedTable
          table={reqTable}
          isLoading={reqLoading}
          total={reqData?.total ?? 0}
          page={reqPage}
          limit={REQ_LIMIT}
          onPageChange={setReqPage}
          skeletonCols={4}
          empty={
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Заявок нет"
              description="Заявки сотрудника появятся здесь."
            />
          }
        />
      </Section>

      {/* ── Admin note ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-foreground">Комментарий администратора</h2>
        <Textarea
          placeholder="Заметки о сотруднике, видимые только администратору..."
          rows={4}
          value={resolvedNote}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteDirty(true);
          }}
          className="resize-none"
        />
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            disabled={!noteDirty || noteMutation.isPending}
            onClick={() => noteMutation.mutate(resolvedNote)}
          >
            <Save className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {noteMutation.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ──────────────────────────────────────────────────────────

function InfoCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/40 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PaginatedTable<T>({
  table,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  skeletonCols,
  empty,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ReturnType<typeof useReactTable<any>>;
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  skeletonCols: number;
  empty: ReactNode;
}) {
  const rows = table.getRowModel().rows;
  const pageCount = Math.ceil(total / limit);

  return (
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
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: skeletonCols }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-32 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>

      {!isLoading && rows.length === 0 && <div className="px-6 py-10">{empty}</div>}

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            {page * limit + 1}–{Math.min((page + 1) * limit, total)} из {total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => onPageChange(page + 1)}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
