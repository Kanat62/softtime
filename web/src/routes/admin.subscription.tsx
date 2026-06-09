import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const SubscriptionPage = lazy(() =>
  import("@/pages/admin/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })),
);

export const Route = createFileRoute("/admin/subscription")({
  component: SubscriptionPage,
  ssr: false,
});
