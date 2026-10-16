import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * Подвал публичных страниц (вход, регистрация, /privacy, /delete-account).
 * Только ссылки, без запросов и без зависимости от сессии.
 */
export function PublicFooter({ className }: { className?: string }) {
  const { t } = useTranslation(["common"]);

  return (
    <footer className={"border-t border-border py-6 " + (className ?? "")}>
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} SoftTime</span>
        <Link to="/privacy" className="transition-colors hover:text-foreground">
          {t("common:privacyPolicy")}
        </Link>
      </div>
    </footer>
  );
}
