import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ReportsPage = lazy(() =>
  import("@/pages/admin/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
  ssr: false,
});
