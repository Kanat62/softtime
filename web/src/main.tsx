import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./app/styles/globals.css";
import { getRouter } from "./app/router/router";

if (import.meta.env.DEV) {
  const { setupMocks } = await import("./shared/api/mock");
  setupMocks();
}

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
