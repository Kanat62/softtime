import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const OfficeNetworksPage = lazy(() =>
  import("@/pages/admin/OfficeNetworksPage").then((m) => ({ default: m.OfficeNetworksPage })),
);

export const Route = createFileRoute("/admin/networks")({
  component: OfficeNetworksPage,
  ssr: false,
});
