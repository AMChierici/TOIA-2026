import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dirFor, translate, type Lang } from "./i18n-core";
import { translations } from "./translations";

const STORAGE_KEY = "toia.lang";
const SUPPORTED: Lang[] = ["en", "ar", "fr", "es"];

function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && SUPPORTED.includes(saved)) return saved;
  const browser = window.navigator.language?.slice(0, 2) as Lang | undefined;
  return browser && SUPPORTED.includes(browser) ? browser : "en";
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Keep the document's language and text direction in sync (RTL for Arabic).
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      dir: dirFor(lang),
      t: (key, vars) => translate(translations, lang, key, vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}
