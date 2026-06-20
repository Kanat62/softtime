import { apiClient } from "@/shared/api/client";

export interface AssistantAnswer {
  answer: string;
  usedPeriodDays: number;
  generatedAt: string;
}

export const assistantApi = {
  ask: (question: string) =>
    apiClient
      .post<AssistantAnswer>("/assistant/ask", { question })
      .then((r) => r.data),

  suggestions: () =>
    apiClient
      .get<{ suggestions: string[] }>("/assistant/suggestions")
      .then((r) => r.data),
};
