import { cn } from "@/shared/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

const TONES: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary-light text-primary border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
};

const STATUS_MAP: Record<string, { tone: Tone; label?: string }> = {
  ACTIVE: { tone: "success", label: "Активен" },
  PRESENT: { tone: "success", label: "В офисе" },
  ON_TIME: { tone: "success", label: "Вовремя" },
  PAID: { tone: "success", label: "Оплачено" },
  APPROVED: { tone: "success", label: "Одобрено" },
  GRACE: { tone: "warning", label: "Льготный период" },
  TRIAL: { tone: "warning", label: "Триал" },
  LATE: { tone: "warning", label: "Опоздание" },
  WARNING: { tone: "warning", label: "Внимание" },
  SUSPENDED: { tone: "danger", label: "Приостановлено" },
  EXPIRED: { tone: "danger", label: "Истёк" },
  CANCELLED: { tone: "danger", label: "Отменена" },
  FAILED: { tone: "danger", label: "Ошибка оплаты" },
  ABSENT: { tone: "danger", label: "Отсутствует" },
  INCOMPLETE: { tone: "danger", label: "Не завершён" },
  BLOCKED: { tone: "danger", label: "Заблокирован" },
  REJECTED: { tone: "danger", label: "Отклонено" },
  PENDING: { tone: "info", label: "На рассмотрении" },
  APPROVED_ABSENCE: { tone: "info", label: "Согласованное отсутствие" },
  MANUAL: { tone: "muted", label: "Ручная правка" },
  EARLY_LEAVE: { tone: "muted", label: "Ранний уход" },
  LEFT_EARLY: { tone: "muted", label: "Ранний уход" },
  OVERTIME: { tone: "muted", label: "Сверхурочно" },
  EARLY_ARRIVAL: { tone: "info", label: "Ранний приход" },
};

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: keyof typeof STATUS_MAP | string;
  className?: string;
  children?: React.ReactNode;
}) {
  const meta = STATUS_MAP[status] ?? { tone: "muted" as Tone, label: status };
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[meta.tone],
        className,
      )}
    >
      {children ?? meta.label}
    </span>
  );
}
