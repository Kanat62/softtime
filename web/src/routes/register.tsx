import { createFileRoute } from "@tanstack/react-router";
import { RegisterCompanyPage } from "@/pages/auth";

export const Route = createFileRoute("/register")({
  component: RegisterCompanyPage,
  ssr: false,
});
