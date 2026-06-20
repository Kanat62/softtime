import { DashboardMetrics } from "@/widgets/dashboard-metrics";
import { SubscriptionWidget } from "@/widgets/subscription-card";
import { PageHeader } from "@/shared/ui";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд" />
      <SubscriptionWidget />
      <DashboardMetrics />
    </div>
  );
}
