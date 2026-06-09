import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const SchedulesPage = lazy(() =>
  import("@/pages/admin/SchedulesPage").then((m) => ({ default: m.SchedulesPage })),
);

export const Route = createFileRoute("/admin/schedules")({
  component: SchedulesPage,
  ssr: false,
});
