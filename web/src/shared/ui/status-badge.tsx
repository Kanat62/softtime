import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

const TONES: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary-light text-primary border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
};

/**
 * Подписи не дублируются здесь: каждый статус указывает путём в общий
 * словарь enums (@softtime/shared) — один источник истины для web,
 * mobile и backend. Путь явный, потому что одно и то же значение в
 * разных енумах значит разное (PENDING у заявки и у платежа).
 */
const STATUS_MAP: Record<string, { tone: Tone; labelKey: string }> = {
  ACTIVE: { tone: "success", labelKey: "enums:userStatus.ACTIVE" },
  PRESENT: { tone: "success", labelKey: "enums:dayStatus.PRESENT" },
  ON_TIME: { tone: "success", labelKey: "enums:checkInStatus.ON_TIME" },
  PAID: { tone: "success", labelKey: "enums:paymentStatus.PAID" },
  APPROVED: { tone: "success", labelKey: "enums:requestStatus.APPROVED" },
  GRACE: { tone: "warning", labelKey: "enums:subStatus.GRACE" },
  TRIAL: { tone: "warning", labelKey: "enums:subStatus.TRIAL" },
  LATE: { tone: "warning", labelKey: "enums:dayStatus.LATE" },
  WARNING: { tone: "warning", labelKey: "enums:userStatus.WARNING" },
  SUSPENDED: { tone: "danger", labelKey: "enums:companyStatus.SUSPENDED" },
  CLOSED: { tone: "danger", labelKey: "enums:companyStatus.CLOSED" },
  EXPIRED: { tone: "danger", labelKey: "enums:subStatus.EXPIRED" },
  CANCELLED: { tone: "danger", labelKey: "enums:subStatus.CANCELLED" },
  FAILED: { tone: "danger", labelKey: "enums:paymentStatus.FAILED" },
  ABSENT: { tone: "danger", labelKey: "enums:dayStatus.ABSENT" },
  INCOMPLETE: { tone: "danger", labelKey: "enums:dayStatus.INCOMPLETE" },
  BLOCKED: { tone: "danger", labelKey: "enums:userStatus.BLOCKED" },
  REJECTED: { tone: "danger", labelKey: "enums:requestStatus.REJECTED" },
  PENDING: { tone: "info", labelKey: "enums:requestStatus.PENDING" },
  APPROVED_ABSENCE: { tone: "info", labelKey: "enums:dayStatus.APPROVED_ABSENCE" },
  MANUAL: { tone: "muted", labelKey: "enums:dayStatus.MANUAL" },
  EARLY_LEAVE: { tone: "muted", labelKey: "enums:dayStatus.EARLY_LEAVE" },
  LEFT_EARLY: { tone: "muted", labelKey: "enums:checkOutStatus.LEFT_EARLY" },
  OVERTIME: { tone: "muted", labelKey: "enums:dayStatus.OVERTIME" },
  EARLY_ARRIVAL: { tone: "info", labelKey: "enums:checkInStatus.EARLY_ARRIVAL" },
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
  const { t } = useTranslation("enums");
  const meta = STATUS_MAP[status];
  const tone: Tone = meta?.tone ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children ?? (meta ? t(meta.labelKey) : status)}
    </span>
  );
}
