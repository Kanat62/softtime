import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const DashboardPage = lazy(() =>
  import("@/pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
  ssr: false,
});
