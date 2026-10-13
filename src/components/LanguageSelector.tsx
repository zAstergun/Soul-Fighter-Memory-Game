import { useState, useRef, useEffect } from "react";
import { useI18n, type LanguageSetting } from "../i18n";
import { sfx } from "../lib/sound";

interface Props {
  compact?: boolean;
  className?: string;
}

export default function LanguageSelector({ compact = false, className = "" }: Props) {
  const { languageSetting, resolvedLanguage, setLanguageSetting, languages, t, isRtl } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeOption = languages.find((l) => l.code === resolvedLanguage);
  const isAuto = languageSetting === "system";

  const handleSelect = (code: LanguageSetting) => {
    sfx.click();
    setLanguageSetting(code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          sfx.click();
          setOpen((v) => !v);
        }}
        aria-label={t("language.selector_title")}
        className={`group flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 backdrop-blur-md transition-all duration-200 hover:border-soul-gold/60 hover:bg-black/70 hover:shadow-[0_0_12px_rgba(255,210,63,0.25)] active:scale-95 ${
          compact
            ? "px-2 py-1 text-[11px]"
            : "px-2.5 py-1 text-xs"
        }`}
      >
        <span className="text-sm leading-none">{isAuto ? "🌐" : activeOption?.flag || "🌐"}</span>
        <span className="font-bold text-white/90 group-hover:text-soul-gold transition truncate max-w-[85px] sm:max-w-[110px]">
          {isAuto ? t("language.system_label") : activeOption?.native || activeOption?.label}
        </span>
        <svg
          className={`h-3 w-3 text-white/50 transition-transform duration-200 group-hover:text-soul-gold ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className={`absolute top-full z-50 mt-1.5 w-64 max-h-80 overflow-y-auto no-scrollbar rounded-2xl border border-soul-gold/30 bg-[#120725]/95 p-1.5 text-white shadow-[0_12px_36px_rgba(0,0,0,0.8),0_0_20px_rgba(255,61,154,0.25)] backdrop-blur-xl ${
            isRtl ? "left-0" : "right-0"
          }`}
        >
          {/* Header */}
          <div className="mb-1 border-b border-white/10 px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-soul-gold uppercase">
              {t("language.selector_title")}
            </span>
            <span className="text-[9.5px] font-mono text-white/40">
              {languages.length - 1} Locales
            </span>
          </div>

          <div className="space-y-0.5">
            {languages.map((lang) => {
              const selected = languageSetting === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition duration-150 ${
                    selected
                      ? "border border-soul-gold/40 bg-soul-gold/15 text-soul-gold font-bold shadow-[0_0_10px_rgba(255,210,63,0.15)]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{lang.flag}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-[11.5px] font-semibold leading-tight">
                        {lang.code === "system" ? t("language.system_label") : lang.native}
                      </span>
                      {lang.code === "system" ? (
                        <span className="text-[9px] text-white/50 leading-tight">
                          {t("language.system_desc")} ({activeOption?.native})
                        </span>
                      ) : lang.native !== lang.label ? (
                        <span className="text-[9px] text-white/40 truncate leading-tight">
                          {lang.label}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {selected && (
                    <span className="shrink-0 text-soul-gold font-bold text-xs">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
