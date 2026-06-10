import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const RegisterCompanyPage = lazy(() =>
  import("@/pages/auth").then((m) => ({ default: m.RegisterCompanyPage })),
);

export const Route = createFileRoute("/register")({
  component: RegisterCompanyPage,
  ssr: false,
});
