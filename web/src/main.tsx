import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./app/styles/globals.css";
// Инициализирует i18next (язык браузера или сохранённый выбор, fallback ru).
// Провайдер не нужен: initReactI18next регистрирует инстанс по умолчанию.
import "./shared/i18n";
import { getRouter } from "./app/router/router";

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
