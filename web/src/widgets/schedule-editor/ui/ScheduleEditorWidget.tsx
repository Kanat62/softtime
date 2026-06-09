import { useState, useMemo, useEffect } from "react";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Weekday } from "@softtime/shared";
import { toast } from "sonner";
import { CalendarDays, PenLine, Users } from "lucide-react";
import { scheduleApi } from "@/entities/schedule/api";
import type { ScheduleDay } from "@/entities/schedule/model/types";
import { userApi } from "@/entities/user/api";
import type { Employee } from "@/entities/user/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/cn";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_ORDER = [
  Weekday.MON,
  Weekday.TUE,
  Weekday.WED,
  Weekday.THU,
  Weekday.FRI,
  Weekday.SAT,
  Weekday.SUN,
] as const;

const WEEKDAY_LABEL: Record<Weekday, string> = {
  [Weekday.MON]: "Пн",
  [Weekday.TUE]: "Вт",
  [Weekday.WED]: "Ср",
  [Weekday.THU]: "Чт",
  [Weekday.FRI]: "Пт",
  [Weekday.SAT]: "Сб",
  [Weekday.SUN]: "Вс",
};

// ─── Form schema ──────────────────────────────────────────────────────────────

const dayFormSchema = z
  .object({
    weekday: z.nativeEnum(Weekday),
    isWorkingDay: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    autoCheckoutBuffer: z.number().int().min(0),
  })
  .superRefine((data, ctx) => {
    if (!data.isWorkingDay) return;
    if (!data.startTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Укажите начало", path: ["startTime"] });
      return;
    }
    if (!data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Укажите окончание",
        path: ["endTime"],
      });
      return;
    }
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    if (toMin(data.endTime) - toMin(data.startTime) < 360) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Рабочий день не менее 6 часов",
        path: ["endTime"],
      });
    }
  });

const scheduleFormSchema = z.object({ days: z.array(dayFormSchema).length(7) });
type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDefaultDays(): ScheduleFormValues["days"] {
  return WEEKDAY_ORDER.map((weekday, idx) => ({
    weekday,
    isWorkingDay: idx < 5,
    startTime: idx < 5 ? "09:00" : "",
    endTime: idx < 5 ? "18:00" : "",
    autoCheckoutBuffer: 60,
  }));
}

function scheduleToFormValues(days: ScheduleDay[]): ScheduleFormValues {
  return {
    days: WEEKDAY_ORDER.map((weekday) => {
      const d = days.find((x) => x.weekday === weekday);
      return {
        weekday,
        isWorkingDay: d?.isWorkingDay ?? false,
        startTime: d?.startTime ?? "",
        endTime: d?.endTime ?? "",
        autoCheckoutBuffer: d?.autoCheckoutBuffer ?? 60,
      };
    }),
  };
}

function formValuesToScheduleDays(values: ScheduleFormValues): ScheduleDay[] {
  return values.days.map((d) => ({
    weekday: d.weekday,
    isWorkingDay: d.isWorkingDay,
    startTime: d.isWorkingDay ? d.startTime || null : null,
    endTime: d.isWorkingDay ? d.endTime || null : null,
    autoCheckoutBuffer: d.autoCheckoutBuffer,
  }));
}

function summaryLabel(days: ScheduleDay[]): string {
  const working = days.filter((d) => d.isWorkingDay);
  if (working.length === 0) return "Нет рабочих дней";
  const first = working[0];
  const times = first.startTime && first.endTime ? `${first.startTime}–${first.endTime}` : "—";
  const dayLabels = working.map((d) => WEEKDAY_LABEL[d.weekday]).join(", ");
  return `${times} · ${dayLabels}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ─── Day editor row ───────────────────────────────────────────────────────────

function DayRow({
  index,
  control,
  errors,
}: {
  index: number;
  control: Control<ScheduleFormValues>;
  errors: FieldErrors<ScheduleFormValues>;
}) {
  const isWorking = useWatch({ control, name: `days.${index}.isWorkingDay` });
  const dayErr = errors.days?.[index];

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl bg-muted/30 px-4 py-3">
      {/* Day label */}
      <span className="w-5 pt-0.5 text-sm font-semibold text-foreground">
        {WEEKDAY_LABEL[WEEKDAY_ORDER[index]]}
      </span>

      {/* Working checkbox */}
      <Controller
        control={control}
        name={`days.${index}.isWorkingDay`}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`working-${index}`}
              checked={field.value}
              onCheckedChange={(v) => field.onChange(!!v)}
            />
            <Label htmlFor={`working-${index}`} className="cursor-pointer text-sm">
              Рабочий
            </Label>
          </div>
        )}
      />

      {isWorking ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Start time */}
          <div className="space-y-1">
            <Controller
              control={control}
              name={`days.${index}.startTime`}
              render={({ field }) => (
                <Input
                  type="time"
                  className={cn("h-8 w-28 text-sm", dayErr?.startTime && "border-destructive")}
                  {...field}
                />
              )}
            />
            {dayErr?.startTime && (
              <p className="text-[11px] text-destructive">{dayErr.startTime.message}</p>
            )}
          </div>

          <span className="text-muted-foreground">–</span>

          {/* End time */}
          <div className="space-y-1">
            <Controller
              control={control}
              name={`days.${index}.endTime`}
              render={({ field }) => (
                <Input
                  type="time"
                  className={cn("h-8 w-28 text-sm", dayErr?.endTime && "border-destructive")}
                  {...field}
                />
              )}
            />
            {dayErr?.endTime && (
              <p className="text-[11px] text-destructive">{dayErr.endTime.message}</p>
            )}
          </div>

          {/* Buffer */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">+</span>
            <Controller
              control={control}
              name={`days.${index}.autoCheckoutBuffer`}
              render={({ field }) => (
                <Input
                  type="number"
                  min={0}
                  max={480}
                  className="h-8 w-16 text-sm"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            <span className="text-xs text-muted-foreground">мин</span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Выходной</span>
      )}
    </div>
  );
}

// ─── Schedule editor ──────────────────────────────────────────────────────────

function ScheduleEditor({
  control,
  errors,
}: {
  control: Control<ScheduleFormValues>;
  errors: FieldErrors<ScheduleFormValues>;
}) {
  const { fields } = useFieldArray({ control, name: "days" });

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <DayRow key={field.id} index={index} control={control} errors={errors} />
      ))}
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function ScheduleEditorWidget() {
  const qc = useQueryClient();

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const empQuery = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 100 }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules(),
    queryFn: () => scheduleApi.listAll(),
    staleTime: 30_000,
  });

  const scheduleMap = useMemo(() => {
    const m = new Map<string, ScheduleDay[]>();
    for (const s of schedulesQuery.data ?? []) m.set(s.userId, s.days);
    return m;
  }, [schedulesQuery.data]);

  // ── Forms ─────────────────────────────────────────────────────────────────
  const individualForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { days: makeDefaultDays() },
  });

  const templateForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { days: makeDefaultDays() },
  });

  useEffect(() => {
    if (!editEmployee) return;
    const existing = scheduleMap.get(editEmployee.id);
    individualForm.reset(existing ? scheduleToFormValues(existing) : { days: makeDefaultDays() });
  }, [editEmployee, scheduleMap]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: ScheduleDay[] }) =>
      scheduleApi.saveByUserId(userId, days),
    onSuccess: () => {
      toast.success("Расписание сохранено");
      setEditEmployee(null);
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: () => toast.error("Ошибка при сохранении"),
  });

  const applyMutation = useMutation({
    mutationFn: (dto: { days: ScheduleDay[]; userIds?: string[] }) =>
      scheduleApi.applyTemplate(dto),
    onSuccess: (_, vars) => {
      const count = vars.userIds?.length ?? employees.length;
      toast.success(`Шаблон применён к ${count} сотруд.`);
      setTemplateOpen(false);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: () => toast.error("Ошибка при применении"),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openEdit(emp: Employee) {
    setEditEmployee(emp);
  }

  function saveIndividual(values: ScheduleFormValues) {
    if (!editEmployee) return;
    saveMutation.mutate({ userId: editEmployee.id, days: formValuesToScheduleDays(values) });
  }

  function applyTemplate(values: ScheduleFormValues) {
    const days = formValuesToScheduleDays(values);
    const userIds = selectedIds.size > 0 ? [...selectedIds] : undefined;
    applyMutation.mutate({ days, userIds });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
    }
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const employees = empQuery.data?.data ?? [];

  const columns: ColumnDef<Employee>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={employees.length > 0 && selectedIds.size === employees.length}
          onCheckedChange={toggleSelectAll}
          aria-label="Выбрать всех"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelect(row.original.id)}
          aria-label="Выбрать"
        />
      ),
    },
    {
      id: "employee",
      header: "Сотрудник",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-semibold text-primary">
            {initials(row.original.fullName)}
          </div>
          <span className="text-sm font-medium text-foreground">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      id: "week",
      header: "График",
      cell: ({ row }) => {
        const days = scheduleMap.get(row.original.id) ?? [];
        return (
          <div className="flex gap-1">
            {WEEKDAY_ORDER.map((wd) => {
              const d = days.find((x) => x.weekday === wd);
              return (
                <div
                  key={wd}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium",
                    d?.isWorkingDay
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {WEEKDAY_LABEL[wd]}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      id: "summary",
      header: "Часы",
      cell: ({ row }) => {
        const days = scheduleMap.get(row.original.id) ?? [];
        return (
          <span className="text-sm text-muted-foreground">
            {schedulesQuery.isLoading ? "…" : summaryLabel(days)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => openEdit(row.original)}
        >
          <PenLine className="h-3.5 w-3.5" strokeWidth={1.5} />
          Редактировать
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Расписания"
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <span className="text-sm text-muted-foreground">Выбрано: {selectedIds.size}</span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                templateForm.reset({ days: makeDefaultDays() });
                setTemplateOpen(true);
              }}
            >
              <Users className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Один для всех
            </Button>
          </div>
        }
      />

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {empQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                qc.invalidateQueries({ queryKey: queryKeys.employees({ page: 1, limit: 100 }) })
              }
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
                {empQuery.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-4 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-3.5 w-32 rounded" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {Array.from({ length: 7 }).map((_, j) => (
                              <Skeleton key={j} className="h-6 w-6 rounded" />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-3.5 w-40 rounded" />
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

            {!empQuery.isLoading && employees.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<CalendarDays className="h-10 w-10" />}
                  title="Нет сотрудников"
                  description="Добавьте сотрудников, чтобы управлять их расписаниями."
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dialog: Расписание сотрудника ────────────────────────────────── */}
      <Dialog open={!!editEmployee} onOpenChange={(open) => !open && setEditEmployee(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Расписание сотрудника</DialogTitle>
            <DialogDescription>{editEmployee?.fullName}</DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-1 flex-col overflow-hidden"
            onSubmit={individualForm.handleSubmit(saveIndividual)}
          >
            <div className="flex-1 overflow-y-auto pr-1">
              <ScheduleEditor
                control={individualForm.control}
                errors={individualForm.formState.errors}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Сохраняем..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Шаблон "Один для всех" ──────────────────────────────── */}
      <Dialog open={templateOpen} onOpenChange={(open) => !open && setTemplateOpen(false)}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Создать шаблон расписания</DialogTitle>
            <DialogDescription>
              {selectedIds.size > 0
                ? `Будет применён к ${selectedIds.size} выбранным сотрудникам`
                : "Будет применён ко всем сотрудникам"}
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-1 flex-col overflow-hidden"
            onSubmit={templateForm.handleSubmit(applyTemplate)}
          >
            <div className="flex-1 overflow-y-auto pr-1">
              <ScheduleEditor control={templateForm.control} errors={templateForm.formState.errors} />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                {applyMutation.isPending
                  ? "Применяем..."
                  : selectedIds.size > 0
                    ? `Применить к выбранным (${selectedIds.size})`
                    : "Применить ко всем"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
