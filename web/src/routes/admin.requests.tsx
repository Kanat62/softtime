import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const RequestsPage = lazy(() =>
  import("@/pages/admin/RequestsPage").then((m) => ({ default: m.RequestsPage })),
);

export const Route = createFileRoute("/admin/requests")({
  component: RequestsPage,
  ssr: false,
});
