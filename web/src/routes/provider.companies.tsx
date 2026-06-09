import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const CompaniesPage = lazy(() =>
  import("@/pages/provider/CompaniesPage").then((m) => ({ default: m.CompaniesPage })),
);

export const Route = createFileRoute("/provider/companies")({
  component: CompaniesPage,
  ssr: false,
});
