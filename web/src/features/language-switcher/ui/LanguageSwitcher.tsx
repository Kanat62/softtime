import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, type Language } from "@softtime/shared";
import { changeLanguage } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

/** Переключатель языка интерфейса в шапке панели. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation(["settings", "common"]);
  // resolvedLanguage, а не language: детектор отдаёт полный тег браузера
  // ("en-US"), а ключи словаря — по базовому языку ("en").
  const current = (i18n.resolvedLanguage ?? FALLBACK_LANGUAGE) as Language;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label={t("settings:language.label")}
        >
          <Languages className="h-4 w-4" />
          {t(`common:language.${current}`)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => void changeLanguage(value as Language)}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuRadioItem key={language} value={language}>
              {t(`common:language.${language}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
