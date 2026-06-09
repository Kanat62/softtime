import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const PaymentsPage = lazy(() =>
  import("@/pages/provider/PaymentsPage").then((m) => ({ default: m.PaymentsPage })),
);

export const Route = createFileRoute("/provider/payments")({
  component: PaymentsPage,
  ssr: false,
});
