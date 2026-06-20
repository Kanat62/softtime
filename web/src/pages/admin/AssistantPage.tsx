import { PageHeader } from "@/shared/ui";
import { InsightsWidget } from "@/widgets/insights-widget";
import { AssistantChat } from "@/features/assistant-chat";

export function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ИИ-аналитик"
        description="Сводка дня и ответы на вопросы по реальной посещаемости вашей компании"
      />
      {/* Проактивная сводка дня (переиспользуем существующий insight) */}
      <InsightsWidget />
      {/* Интерактивный чат с ИИ-аналитиком */}
      <AssistantChat />
    </div>
  );
}
