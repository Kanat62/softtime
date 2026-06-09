import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const SettingsPage = lazy(() =>
  import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  ssr: false,
});
