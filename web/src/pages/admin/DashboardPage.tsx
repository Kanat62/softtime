import { DashboardMetrics } from "@/widgets/dashboard-metrics";
import { useTranslation } from "react-i18next";
import { SubscriptionWidget } from "@/widgets/subscription-card";
import { PageHeader } from "@/shared/ui";

export function DashboardPage() {
  const { t } = useTranslation("dashboard");
  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboard:title")} />
      <SubscriptionWidget />
      <DashboardMetrics />
    </div>
  );
}
