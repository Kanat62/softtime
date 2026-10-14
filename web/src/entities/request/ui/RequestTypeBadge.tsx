import { RequestType } from "@softtime/shared";
import { useTranslation } from "react-i18next";

export function RequestTypeBadge({ type }: { type: RequestType }) {
  // Подписи — из общего словаря enums, локальной карты нет.
  const { t } = useTranslation("enums");
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {t(`enums:requestType.${type}`)}
    </span>
  );
}
