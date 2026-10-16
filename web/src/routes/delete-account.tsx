import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const DeleteAccountPage = lazy(() =>
  import("@/pages/legal").then((m) => ({ default: m.DeleteAccountPage })),
);

// Публичная страница: не под ProtectedRoute, без входа. URL для Google Play.
export const Route = createFileRoute("/delete-account")({
  component: DeleteAccountPage,
  ssr: false,
});
