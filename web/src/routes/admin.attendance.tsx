import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const AttendancePage = lazy(() =>
  import("@/pages/admin/AttendancePage").then((m) => ({ default: m.AttendancePage })),
);

export const Route = createFileRoute("/admin/attendance")({
  component: AttendancePage,
  ssr: false,
});
