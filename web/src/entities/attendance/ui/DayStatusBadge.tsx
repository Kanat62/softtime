import { StatusBadge } from "@/shared/ui/status-badge";
import { useTranslation } from "react-i18next";
import type { DayStatus } from "../model/types";

export function DayStatusBadge({ status, isManual }: { status: DayStatus; isManual?: boolean }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-1.5">
      <StatusBadge status={status} />
      {isManual && (
        <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {t("common:manualShort")}
        </span>
      )}
    </div>
  );
}
