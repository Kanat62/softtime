import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserStatus } from "@softtime/shared";
import {
  MoreHorizontal,
  Users,
  CheckCircle2,
  XCircle,
  UserX,
  ShieldAlert,
  Search,
  Eye,
} from "lucide-react";
import { userApi } from "@/entities/user/api";
import type { Employee } from "@/entities/user/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState, StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/cn";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useApproveEmployee } from "@/features/employee/approve-employee";
import { useRejectEmployee } from "@/features/employee/reject-employee";
import { useChangeEmployeeStatus } from "@/features/employee/change-employee-status";
import { useSoftDeleteEmployee } from "@/features/employee/soft-delete-employee";

// ─── Constants ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_TABS: { label: string; value: UserStatus | "" }[] = [
  { label: "Все", value: "" },
  { label: "Активные", value: UserStatus.ACTIVE },
  { label: "Ожидают", value: UserStatus.PENDING },
  { label: "Внимание", value: UserStatus.WARNING },
  { label: "Заблокированы", value: UserStatus.BLOCKED },
];

// ─── Action state ───────────────────────────────────────────────────────────

type ActionType = "approve-reject" | "activate" | "block" | "delete";

interface PendingAction {
  type: ActionType;
  employee: Employee;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return "—";
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ─── Widget ─────────────────────────────────────────────────────────────────

export function EmployeesTable() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<PendingAction | null>(null);

  // Debounce search via a separate state updated on blur / Enter
  const commitSearch = useCallback(() => setSearch(searchRaw), [searchRaw]);

  const queryParams = { page: page + 1, limit: PAGE_SIZE, status: statusFilter, search };

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.employees(queryParams),
    queryFn: () => userApi.listEmployees(queryParams),
    placeholderData: (prev) => prev,
  });

  // ─── Feature hooks ─────────────────────────────────────────────────────

  const approveMutation = useApproveEmployee(() => setAction(null));
  const rejectMutation = useRejectEmployee(() => setAction(null));
  const statusMutation = useChangeEmployeeStatus(() => setAction(null));
  const deleteMutation = useSoftDeleteEmployee(() => setAction(null));

  // ─── Table columns ─────────────────────────────────────────────────────

  const columns: ColumnDef<Employee>[] = [
    {
      id: "name",
      header: "ФИО / Email",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
              {initials(e.fullName)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{e.fullName}</div>
              <div className="truncate text-xs text-muted-foreground">{e.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "hiredAt",
      header: "Дата найма",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.hiredAt)}</span>
      ),
    },
    {
      id: "lastActivity",
      header: "Последняя активность",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.lastActivityAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          employee={row.original}
          onAction={setAction}
          onView={(id) => navigate({ to: "/admin/employees/$id", params: { id } })}
        />
      ),
    },
  ];

  const employees = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    state: { pagination: { pageIndex: page, pageSize: PAGE_SIZE } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex: page, pageSize: PAGE_SIZE }) : updater;
      setPage(next.pageIndex);
    },
  });

  // ─── Summary line ───────────────────────────────────────────────────────

  const summary = total > 0 ? `${total} сотрудник${total === 1 ? "" : total < 5 ? "а" : "ов"}` : "";

  return (
    <div className="space-y-6">
      <PageHeader title="Сотрудники" />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            className="pl-9"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
          />
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(0);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Не удалось загрузить сотрудников.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => qc.invalidateQueries({ queryKey: ["employees"] })}
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
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-3.5 w-32 rounded" />
                              <Skeleton className="h-3 w-44 rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-24 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-24 rounded" />
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

            {/* Empty state */}
            {!isLoading && employees.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<Users className="h-10 w-10" />}
                  title="Сотрудников нет"
                  description={
                    search || statusFilter
                      ? "По вашему запросу ничего не найдено. Попробуйте изменить фильтры."
                      : "Сотрудники появятся здесь после регистрации через мобильное приложение."
                  }
                  action={
                    search || statusFilter ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setSearchRaw("");
                          setStatusFilter("");
                        }}
                      >
                        Сбросить фильтры
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            )}

            {/* Pagination */}
            {!isLoading && total > 0 && (
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

      {/* ── Dialog: Approve / Reject (for PENDING) ────────────────────── */}
      <Dialog
        open={action?.type === "approve-reject"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Новый сотрудник</DialogTitle>
            <DialogDescription>
              {action?.employee.fullName} запрашивает доступ к системе.
            </DialogDescription>
          </DialogHeader>
          {action?.employee && (
            <div className="space-y-3 rounded-xl bg-muted/40 px-4 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ФИО</span>
                <span className="font-medium">{action.employee.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{action.employee.email}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              disabled={rejectMutation.isPending}
              onClick={() => action && rejectMutation.mutate(action.employee.id)}
            >
              <XCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Отклонить
            </Button>
            <Button
              className="flex-1"
              disabled={approveMutation.isPending}
              onClick={() => action && approveMutation.mutate(action.employee.id)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Принять
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Block ─────────────────────────────────────────── */}
      <AlertDialog
        open={action?.type === "block"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заблокировать сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              {action?.employee.fullName} потеряет доступ к системе. Вы сможете разблокировать его
              позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                action &&
                statusMutation.mutate({ id: action.employee.id, status: UserStatus.BLOCKED })
              }
            >
              Заблокировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── AlertDialog: Activate ──────────────────────────────────────── */}
      <AlertDialog
        open={action?.type === "activate"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Активировать сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              {action?.employee.fullName} получит доступ к системе.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                action &&
                statusMutation.mutate({ id: action.employee.id, status: UserStatus.ACTIVE })
              }
            >
              Активировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── AlertDialog: Delete ────────────────────────────────────────── */}
      <AlertDialog
        open={action?.type === "delete"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Данные {action?.employee.fullName} будут безвозвратно
              удалены из системы, включая историю посещаемости.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => action && deleteMutation.mutate(action.employee.id)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Row actions dropdown ───────────────────────────────────────────────────

function RowActions({
  employee,
  onAction,
  onView,
}: {
  employee: Employee;
  onAction: (a: PendingAction) => void;
  onView: (id: string) => void;
}) {
  const isPending = employee.status === UserStatus.PENDING;
  const isBlocked = employee.status === UserStatus.BLOCKED;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Действия</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(employee.id)}>
          <Eye className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Открыть профиль
        </DropdownMenuItem>

        {isPending && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction({ type: "approve-reject", employee })}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-success" strokeWidth={1.5} />
              Принять / Отклонить
            </DropdownMenuItem>
          </>
        )}

        {!isPending && (
          <>
            <DropdownMenuSeparator />
            {isBlocked ? (
              <DropdownMenuItem onClick={() => onAction({ type: "activate", employee })}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-success" strokeWidth={1.5} />
                Активировать
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onAction({ type: "block", employee })}
              >
                <ShieldAlert className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Заблокировать
              </DropdownMenuItem>
            )}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onAction({ type: "delete", employee })}
        >
          <UserX className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
