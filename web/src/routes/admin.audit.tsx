import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const AuditLogPage = lazy(() =>
  import("@/pages/admin/AuditLogPage").then((m) => ({ default: m.AuditLogPage })),
);

export const Route = createFileRoute("/admin/audit")({
  component: AuditLogPage,
  ssr: false,
});
