import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const EmployeesPage = lazy(() =>
  import("@/pages/admin/EmployeesPage").then((m) => ({ default: m.EmployeesPage })),
);

export const Route = createFileRoute("/admin/employees/")({
  component: EmployeesPage,
  ssr: false,
});
