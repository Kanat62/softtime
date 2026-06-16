import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { DashboardMetrics } from "@/widgets/dashboard-metrics";
import { SubscriptionWidget } from "@/widgets/subscription-card";
import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { companyApi } from "@/entities/company/api";
import { ROUTES } from "@/shared/config/routes";

function RequisitesBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ["company-requisites"],
    queryFn: companyApi.getRequisites,
  });

  if (isLoading || data?.tax_id) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-warning/40 bg-warning/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 shrink-0 text-warning-foreground" />
        <p className="text-sm text-foreground">
          Заполните реквизиты компании для налоговой отчётности (СТИ-161).
        </p>
      </div>
      <Link to={ROUTES.admin.settings}>
        <Button size="sm" variant="outline" className="shrink-0">
          Заполнить
        </Button>
      </Link>
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд" />
      <RequisitesBanner />
      <SubscriptionWidget />
      <DashboardMetrics />
    </div>
  );
}
