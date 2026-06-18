import { Globe } from "lucide-react";
import { LANGUAGES, type Lang } from "@/lib/i18n-core";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Navbar language switcher (EN / AR / FR / ES). */
export function LanguageSelector({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Globe className="pointer-events-none absolute left-2 size-4 text-muted-foreground" />
      <select
        aria-label={t("nav.language")}
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="h-9 appearance-none rounded-md border border-input bg-background py-1 pl-8 pr-7 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
