import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type Language } from "@softtime/shared";
import { env } from "@/shared/config/env";
import { changeLanguage } from "@/shared/i18n";

/**
 * Публичная страница /delete-account — без входа, ru/en.
 * Это URL «удаление аккаунта» для Google Play (Data safety) и справка
 * для App Store. Не зависит от сессии и не делает запросов к API.
 */
export function DeleteAccountPage() {
  const { t, i18n } = useTranslation(["legal", "common"]);
  const current = (i18n.resolvedLanguage ?? i18n.language) as Language;

  const list = (key: string) =>
    t(key, { returnObjects: true, ns: "legal" }) as unknown as string[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/softtime-icon.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold text-foreground">SoftTime</span>
          </div>
          <div className="flex items-center gap-1" role="group" aria-label={t("legal:deleteAccount.language")}>
            {SUPPORTED_LANGUAGES.map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => void changeLanguage(lng)}
                aria-pressed={lng === current}
                className={
                  "rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors " +
                  (lng === current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {lng}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("legal:deleteAccount.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("legal:deleteAccount.intro")}
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("legal:deleteAccount.stepsTitle")}</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-foreground">
            {list("deleteAccount.steps").map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("legal:deleteAccount.erasedTitle")}</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground">
            {list("deleteAccount.erased").map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("legal:deleteAccount.keptTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("legal:deleteAccount.keptIntro")}
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground">
            {list("deleteAccount.kept").map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("legal:deleteAccount.afterTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{t("legal:deleteAccount.after")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("legal:deleteAccount.adminTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{t("legal:deleteAccount.admin")}</p>
        </section>

        <section className="rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="text-lg font-semibold text-foreground">{t("legal:deleteAccount.contactTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("legal:deleteAccount.contact")}</p>
          <a
            href={`mailto:${env.supportEmail}`}
            className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {env.supportEmail}
          </a>
        </section>
      </main>
    </div>
  );
}
