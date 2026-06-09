import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const EmployeeDetailPage = lazy(() =>
  import("@/pages/admin/EmployeeDetailPage").then((m) => ({ default: m.EmployeeDetailPage })),
);

export const Route = createFileRoute("/admin/employees/$id")({
  component: EmployeeDetailPage,
  ssr: false,
});
