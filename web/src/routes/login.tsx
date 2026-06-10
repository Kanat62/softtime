import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const LoginPage = lazy(() =>
  import("@/pages/auth").then((m) => ({ default: m.LoginPage })),
);

export const Route = createFileRoute("/login")({
  component: LoginPage,
  ssr: false,
});
