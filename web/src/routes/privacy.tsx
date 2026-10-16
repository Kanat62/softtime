import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const PrivacyPage = lazy(() =>
  import("@/pages/legal").then((m) => ({ default: m.PrivacyPage })),
);

// Публичная страница: не под ProtectedRoute, без входа.
// Язык можно задать через ?lang=ru|en (ссылка из мобильного приложения).
export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  ssr: false,
});
