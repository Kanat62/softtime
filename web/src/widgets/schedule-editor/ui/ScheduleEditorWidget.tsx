import { useState, useMemo, useEffect, useCallback, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
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
import { isNormalizedError } from "@/shared/api/error";
import { PageHeader, EmptyState } from "@/shared/ui";
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

// ─── Form schema (mirrors backend rule: working day ≥ 6 hours) ───────────────

const dayFormSchema = z
  .object({
    weekday: z.nativeEnum(Weekday),
    isWorkingDay: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    autoCheckoutBuffer: z.number().int().min(0).max(480),
  })
  .superRefine((data, ctx) => {
    if (!data.isWorkingDay) return;
    if (!data.startTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "schedules:validation.startRequired", path: ["startTime"] });
      return;
    }
    if (!data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "schedules:validation.endRequired",
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
        message: "schedules:validation.minHours",
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
  if (working.length === 0) return i18n.t("schedules:noWorkingDays");
  const first = working[0];
  const times = first.startTime && first.endTime ? `${first.startTime}–${first.endTime}` : "—";
  const dayLabels = working.map((d) => i18n.t(`enums:weekdayShort.${d.weekday}`)).join(", ");
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
  isWorking,
  control,
  setValue,
  errors,
}: {
  index: number;
  isWorking: boolean;
  control: Control<ScheduleFormValues>;
  setValue: UseFormSetValue<ScheduleFormValues>;
  errors: FieldErrors<ScheduleFormValues>;
}) {
  const { t } = useTranslation(["schedules", "enums"]);
  const dayErr = errors.days?.[index];

  const handleWorkingChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(`days.${index}.isWorkingDay`, e.target.checked, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [index, setValue],
  );

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl bg-muted/30 px-4 py-3">
      <span className="w-5 pt-0.5 text-sm font-semibold text-foreground">
        {t(`enums:weekdayShort.${WEEKDAY_ORDER[index]}`)}
      </span>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`working-${index}`}
          checked={isWorking}
          onChange={handleWorkingChange}
          className="h-4 w-4 cursor-pointer rounded-sm border border-primary accent-primary"
        />
        <Label htmlFor={`working-${index}`} className="cursor-pointer text-sm">
          {t("schedules:working")}
        </Label>
      </div>

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
              <p className="text-[11px] text-destructive">{t(dayErr.startTime.message ?? "")}</p>
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
              <p className="text-[11px] text-destructive">{t(dayErr.endTime.message ?? "")}</p>
            )}
          </div>

          {/* Checkout buffer */}
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
            <span className="text-xs text-muted-foreground">{t("schedules:minutesShort")}</span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{t("schedules:dayOff")}</span>
      )}
    </div>
  );
}

// ─── Schedule editor (7-day grid) ─────────────────────────────────────────────

function ScheduleEditor({
  control,
  setValue,
  dayValues,
  errors,
}: {
  control: Control<ScheduleFormValues>;
  setValue: UseFormSetValue<ScheduleFormValues>;
  dayValues: ScheduleFormValues["days"];
  errors: FieldErrors<ScheduleFormValues>;
}) {
  const { t } = useTranslation(["schedules", "enums"]);
  const { fields } = useFieldArray({ control, name: "days" });

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <DayRow
          key={field.id}
          index={index}
          isWorking={dayValues[index]?.isWorkingDay ?? false}
          control={control}
          setValue={setValue}
          errors={errors}
        />
      ))}
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function ScheduleEditorWidget() {
  const { t } = useTranslation(["schedules", "enums", "common"]);
  const qc = useQueryClient();

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  // ── Employee list ────────────────────────────────────────────────────────
  const empQuery = useQuery({
    queryKey: queryKeys.employees({ page: 1, limit: 100 }),
    queryFn: () => userApi.listEmployees({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });
  const employees = empQuery.data?.data ?? [];

  // ── Per-employee schedule queries (parallel) ─────────────────────────────
  // Backend has no bulk endpoint; fetch each schedule individually.
  const scheduleQueries = useQueries({
    queries: employees.map((emp) => ({
      queryKey: queryKeys.schedules({ userId: emp.id }),
      queryFn: () => scheduleApi.getByUserId(emp.id),
      staleTime: 30_000,
      enabled: employees.length > 0,
    })),
  });

  const schedulesLoading = scheduleQueries.some((q) => q.isLoading);

  const scheduleMap = useMemo(() => {
    const m = new Map<string, ScheduleDay[]>();
    employees.forEach((emp, i) => {
      const data = scheduleQueries[i]?.data;
      if (data) m.set(emp.id, data);
    });
    return m;
  }, [employees, scheduleQueries]);

  // ── Forms ─────────────────────────────────────────────────────────────────
  const individualForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { days: makeDefaultDays() },
  });

  const templateForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { days: makeDefaultDays() },
  });

  // Watch day values HERE (outside the portal) — useWatch inside createPortal doesn't
  // fire in React 19, so we derive values at the widget level and pass them as props.
  const individualDays = useWatch({ control: individualForm.control, name: "days" }) ?? makeDefaultDays();
  const templateDays = useWatch({ control: templateForm.control, name: "days" }) ?? makeDefaultDays();


  // ── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: ScheduleDay[] }) =>
      scheduleApi.saveByUserId(userId, days),
    onSuccess: () => {
      toast.success(t("schedules:toast.saved"));
      setEditEmployee(null);
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: (err) => {
      // Surface the backend 422 message (e.g. "Working day must be at least 6 hours")
      const msg = isNormalizedError(err) ? err.message : t("schedules:toast.saveFailed");
      toast.error(msg);
    },
  });

  const applyMutation = useMutation({
    mutationFn: (dto: { days: ScheduleDay[]; userIds?: string[] }) =>
      scheduleApi.applyToAll(dto),
    onSuccess: (_, vars) => {
      const count = vars.userIds?.length ?? employees.length;
      toast.success(t("schedules:toast.applied", { count }));
      setTemplateOpen(false);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : t("schedules:toast.applyFailed");
      toast.error(msg);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  function saveIndividual(values: ScheduleFormValues) {
    if (!editEmployee) return;
    saveMutation.mutate({ userId: editEmployee.id, days: formValuesToScheduleDays(values) });
  }

  function applyTemplate(values: ScheduleFormValues) {
    const days = formValuesToScheduleDays(values);
    const userIds = selectedIds.size > 0 ? [...selectedIds] : undefined;
    applyMutation.mutate({ days, userIds });
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === employees.length
        ? new Set()
        : new Set(employees.map((e) => e.id)),
    );
  }, [employees]);

  // ── Table ─────────────────────────────────────────────────────────────────
  // columns must be memoized — flexRender treats functions as React components
  // (React.createElement), so a new function reference causes unmount+remount,
  // which triggers the @radix-ui/react-checkbox React 19 ref cleanup bug.
  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={employees.length > 0 && selectedIds.size === employees.length}
          onChange={toggleSelectAll}
          aria-label={t("schedules:selectAll")}
          className="h-4 w-4 cursor-pointer rounded-sm accent-primary"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => toggleSelect(row.original.id)}
          aria-label={t("schedules:selectOne")}
          className="h-4 w-4 cursor-pointer rounded-sm accent-primary"
        />
      ),
    },
    {
      id: "employee",
      header: t("common:employee"),
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
      header: t("schedules:columns.schedule"),
      cell: ({ row }) => {
        const days = scheduleMap.get(row.original.id) ?? [];
        return schedulesLoading ? (
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-6 rounded" />
            ))}
          </div>
        ) : (
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
                  {t(`enums:weekdayShort.${wd}`)}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      id: "summary",
      header: t("schedules:columns.hours"),
      cell: ({ row }) => {
        const days = scheduleMap.get(row.original.id) ?? [];
        if (schedulesLoading) return <Skeleton className="h-3.5 w-36 rounded" />;
        return (
          <span className="text-sm text-muted-foreground">{summaryLabel(days)}</span>
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
          onClick={() => {
            const existing = scheduleMap.get(row.original.id);
            individualForm.reset(
              existing?.length
                ? scheduleToFormValues(existing)
                : { days: makeDefaultDays() },
            );
            setEditEmployee(row.original);
          }}
        >
          <PenLine className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("common:edit")}
        </Button>
      ),
    },
  ], [employees, selectedIds, schedulesLoading, scheduleMap, toggleSelect, toggleSelectAll, setEditEmployee, individualForm]);

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("schedules:title")}
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {t("schedules:selected", { count: selectedIds.size })}
              </span>
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
              {t("schedules:oneForAll")}
            </Button>
          </div>
        }
      />

      {/* ── Таблица ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {empQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("common:loadFailedShort")}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                qc.invalidateQueries({ queryKey: queryKeys.employees({ page: 1, limit: 100 }) })
              }
            >
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
                  title={t("schedules:emptyTitle")}
                  description={t("schedules:emptyDescription")}
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
            <DialogTitle>{t("schedules:dialog.title")}</DialogTitle>
            <DialogDescription>{editEmployee?.fullName}</DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-1 flex-col overflow-hidden"
            onSubmit={individualForm.handleSubmit(saveIndividual)}
          >
            <div className="flex-1 overflow-y-auto pr-1">
              <ScheduleEditor
                control={individualForm.control}
                setValue={individualForm.setValue}
                dayValues={individualDays}
                errors={individualForm.formState.errors}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t("common:saving") : t("common:save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Шаблон "Один для всех" ──────────────────────────────── */}
      <Dialog open={templateOpen} onOpenChange={(open) => !open && setTemplateOpen(false)}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("schedules:templateDialog.title")}</DialogTitle>
            <DialogDescription>
              {selectedIds.size > 0
                ? t("schedules:templateDialog.toSelected", { count: selectedIds.size })
                : t("schedules:templateDialog.toAll")}
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-1 flex-col overflow-hidden"
            onSubmit={templateForm.handleSubmit(applyTemplate)}
          >
            <div className="flex-1 overflow-y-auto pr-1">
              <ScheduleEditor
                control={templateForm.control}
                setValue={templateForm.setValue}
                dayValues={templateDays}
                errors={templateForm.formState.errors}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                {applyMutation.isPending
                  ? t("schedules:templateDialog.applying")
                  : selectedIds.size > 0
                    ? t("schedules:templateDialog.applyToSelected", { count: selectedIds.size })
                    : t("schedules:templateDialog.applyToAll")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
