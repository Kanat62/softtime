import { RequestType } from "@softtime/shared";

const TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.SICK]: "Больничный",
  [RequestType.FAMILY]: "Семейные обстоятельства",
  [RequestType.VACATION]: "Отпуск",
  [RequestType.BUSINESS_TRIP]: "Командировка",
  [RequestType.REMOTE]: "Удалённая работа",
  [RequestType.LATE_REASON]: "Опоздание",
  [RequestType.EARLY_LEAVE]: "Ранний уход",
  [RequestType.OTHER]: "Другое",
};

export function RequestTypeBadge({ type }: { type: RequestType }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}
