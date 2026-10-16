import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type Language } from "@softtime/shared";
import { env } from "@/shared/config/env";
import { PRIVACY_LAST_UPDATED } from "@/shared/config/legal";
import { changeLanguage } from "@/shared/i18n";
import { PublicFooter } from "@/shared/ui/public-footer";

/** Раздел политики из словаря: заголовок + абзацы + список. */
interface Section {
  heading: string;
  body?: string[];
  items?: string[];
}

function isSupported(value: string | null): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Публичная страница /privacy — без входа, ru/en, ни одного запроса к API.
 *
 * Язык: сначала ?lang=ru|en (чтобы ссылка из мобильного приложения открывалась
 * на языке приложения), иначе язык интерфейса, который определяет
 * LanguageDetector по localStorage и языку браузера.
 *
 * Текст лежит в словарях legal.json (privacy.sections) — это источник правды,
 * в разметке его нет. Адрес поддержки не захардкожен: в тексте пишется
 * {{email}} и подставляется из env.supportEmail (VITE_SUPPORT_EMAIL).
 */
export function PrivacyPage() {
  const { t, i18n } = useTranslation(["legal", "common"]);
  const current = (i18n.resolvedLanguage ?? i18n.language) as Language;

  // ?lang имеет приоритет над сохранённым языком. Читаем из window, а не из
  // роутера: страница рендерится с ssr: false, роутер здесь ничего не добавит.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (isSupported(requested) && requested !== i18n.resolvedLanguage) {
      void changeLanguage(requested);
    }
  }, [i18n.resolvedLanguage]);

  const sections = t("privacy.sections", {
    ns: "legal",
    returnObjects: true,
    email: env.supportEmail,
  }) as unknown as Section[];

  const updated = new Intl.DateTimeFormat(current, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(PRIVACY_LAST_UPDATED);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/softtime-icon.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold text-foreground">SoftTime</span>
          </div>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label={t("legal:privacy.language")}
          >
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

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">{t("legal:privacy.title")}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("legal:privacy.lastUpdatedLabel")}: {updated}
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section, i) => (
            <section key={`${i}-${section.heading}`}>
              <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
              {section.body?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
              {section.items && section.items.length > 0 && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("legal:privacy.contactTitle")}
          </h2>
          <a
            href={`mailto:${env.supportEmail}`}
            className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {env.supportEmail}
          </a>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
