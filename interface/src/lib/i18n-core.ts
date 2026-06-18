export type Lang = "en" | "ar" | "fr" | "es";

export interface LanguageOption {
  code: Lang;
  label: string;
  /** BCP-47 tag for speech APIs / video locale. */
  locale: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", locale: "en-US" },
  { code: "ar", label: "العربية", locale: "ar-SA" },
  { code: "fr", label: "Français", locale: "fr-FR" },
  { code: "es", label: "Español", locale: "es-ES" },
];

export type Translations = Record<Lang, Record<string, string>>;

/**
 * Look up `key` for `lang`, falling back to English and then to the raw key.
 * Replaces `{{name}}` placeholders from `vars`.
 */
export function translate(
  translations: Translations,
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const raw = translations[lang]?.[key] ?? translations.en?.[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{{${name}}}`,
  );
}

/** Text direction for a language (Arabic is right-to-left). */
export function dirFor(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}
