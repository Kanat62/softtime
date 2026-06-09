import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const NewsPage = lazy(() =>
  import("@/pages/admin/NewsPage").then((m) => ({ default: m.NewsPage })),
);

export const Route = createFileRoute("/admin/news")({
  component: NewsPage,
  ssr: false,
});
