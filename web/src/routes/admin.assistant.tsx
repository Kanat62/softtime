import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const AssistantPage = lazy(() =>
  import("@/pages/admin/AssistantPage").then((m) => ({ default: m.AssistantPage })),
);

export const Route = createFileRoute("/admin/assistant")({
  component: AssistantPage,
  ssr: false,
});
