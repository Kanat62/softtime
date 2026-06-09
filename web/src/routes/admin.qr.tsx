import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const QrPage = lazy(() => import("@/pages/admin/QrPage").then((m) => ({ default: m.QrPage })));

export const Route = createFileRoute("/admin/qr")({
  component: QrPage,
  ssr: false,
});
