import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ProviderDashboardPage = lazy(() =>
  import("@/pages/provider/ProviderDashboardPage").then((m) => ({
    default: m.ProviderDashboardPage,
  })),
);

export const Route = createFileRoute("/provider/dashboard")({
  component: ProviderDashboardPage,
  ssr: false,
});
