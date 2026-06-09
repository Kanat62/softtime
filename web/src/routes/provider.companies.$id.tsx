import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const CompanyDetailPage = lazy(() =>
  import("@/pages/provider/CompanyDetailPage").then((m) => ({ default: m.CompanyDetailPage })),
);

export const Route = createFileRoute("/provider/companies/$id")({
  component: CompanyDetailPage,
  ssr: false,
});
