import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  LanguageOption,
  LanguageSetting,
  SupportedLanguage,
  TranslationDictionary,
} from "./types";
import { LANGUAGE_OPTIONS } from "./types";
import { DICTIONARIES } from "./locales";
import { supabase } from "../lib/supabase";

export * from "./types";
export * from "./locales";

const STORAGE_KEY = "sf.language";

export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === "undefined" || !navigator) return "pt-BR";

  const rawLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || ""];

  for (const raw of rawLanguages) {
    if (!raw) continue;
    const lang = raw.toLowerCase().trim();

    if (lang.startsWith("pt-pt") || lang.startsWith("pt-mz") || lang.startsWith("pt-ao")) {
      return "pt-PT";
    }
    if (lang.startsWith("pt")) {
      return "pt-BR";
    }
    if (lang.startsWith("en")) {
      return "en";
    }
    if (lang.startsWith("es")) {
      return "es";
    }
    if (lang.startsWith("zh")) {
      return "zh-CN";
    }
    if (lang.startsWith("fr")) {
      return "fr";
    }
    if (lang.startsWith("de")) {
      return "de";
    }
    if (lang.startsWith("it")) {
      return "it";
    }
    if (lang.startsWith("ar")) {
      return "ar";
    }
    if (lang.startsWith("id") || lang.startsWith("in")) {
      return "id";
    }
    if (lang.startsWith("ja")) {
      return "ja";
    }
    if (lang.startsWith("ko")) {
      return "ko";
    }
    if (lang.startsWith("nl")) {
      return "nl";
    }
    if (lang.startsWith("ru")) {
      return "ru";
    }
    if (lang.startsWith("vi")) {
      return "vi";
    }
  }

  return "pt-BR";
}

let currentActiveLanguage: SupportedLanguage = "pt-BR";

export function getCurrentLanguage(): SupportedLanguage {
  return currentActiveLanguage;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatI18nString(
  raw: string,
  params?: Record<string, string | number> | Array<string | number>
): string {
  if (!params) return raw;
  let formatted = raw;

  if (Array.isArray(params)) {
    params.forEach((val, idx) => {
      formatted = formatted.replace(new RegExp(`\\{${idx}\\}`, "g"), String(val));
      formatted = formatted.replace(new RegExp(`\\$\\{${idx}\\}`, "g"), String(val));
    });
    if (formatted.includes("${")) {
      let idx = 0;
      formatted = formatted.replace(/\$\{[^}]+\}/g, () => {
        const val = idx < params.length ? params[idx] : "";
        idx++;
        return String(val);
      });
    }
  } else {
    const entries = Object.entries(params);
    entries.forEach(([k, v]) => {
      const esc = escapeRegex(k);
      formatted = formatted.replace(new RegExp(`\\{${esc}\\}`, "g"), String(v));
      formatted = formatted.replace(new RegExp(`\\$\\{${esc}\\}`, "g"), String(v));
    });

    if (formatted.includes("${")) {
      entries.forEach(([k, v]) => {
        const esc = escapeRegex(k);
        formatted = formatted.replace(new RegExp(`\\$\\{[^}]*\\b${esc}\\b[^}]*\\}`, "gi"), String(v));
      });
    }

    if (formatted.includes("${") && entries.length === 1) {
      formatted = formatted.replace(/\$\{[^}]+\}/g, String(entries[0][1]));
    }
  }

  return formatted;
}

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  if (typeof obj[path] === "string") return obj[path];
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(
  path: string,
  params?: Record<string, string | number> | Array<string | number>,
  fallback?: string
): string {
  const dict = DICTIONARIES[currentActiveLanguage] || DICTIONARIES["pt-BR"];
  const fallbackDict = DICTIONARIES["pt-BR"];

  let result = typeof (dict as any)[path] === "string" ? (dict as any)[path] : undefined;
  if (result === undefined) {
    result = getNestedValue(dict, path);
  }
  if (result === undefined) {
    result = typeof (fallbackDict as any)[path] === "string" ? (fallbackDict as any)[path] : undefined;
  }
  if (result === undefined) {
    result = getNestedValue(fallbackDict, path);
  }
  if (result === undefined) {
    result = fallback !== undefined ? fallback : path;
  }

  return formatI18nString(result, params);
}

interface I18nContextValue {
  languageSetting: LanguageSetting;
  resolvedLanguage: SupportedLanguage;
  isRtl: boolean;
  dict: TranslationDictionary;
  setLanguageSetting: (setting: LanguageSetting, syncToProfile?: boolean) => Promise<void>;
  t: (
    path: string,
    params?: Record<string, string | number> | Array<string | number>,
    fallback?: string
  ) => string;
  languages: readonly LanguageOption[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [languageSetting, setLanguageSettingState] = useState<LanguageSetting>(() => {
    if (typeof window === "undefined") return "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("studioos.language");
      if (
        stored &&
        (stored === "system" ||
          LANGUAGE_OPTIONS.some((o) => o.code === stored))
      ) {
        return stored as LanguageSetting;
      }
    } catch {
      // ignore
    }
    return "system";
  });

  const [systemDetectedLanguage, setSystemDetectedLanguage] = useState<SupportedLanguage>(
    () => detectBrowserLanguage()
  );

  useEffect(() => {
    const handleLanguageChange = () => {
      setSystemDetectedLanguage(detectBrowserLanguage());
    };
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  const resolvedLanguage: SupportedLanguage = useMemo(() => {
    if (languageSetting === "system") {
      return systemDetectedLanguage;
    }
    return languageSetting;
  }, [languageSetting, systemDetectedLanguage]);

  useEffect(() => {
    currentActiveLanguage = resolvedLanguage;
  }, [resolvedLanguage]);

  const isRtl = resolvedLanguage === "ar";
  const dict = useMemo(() => DICTIONARIES[resolvedLanguage] || DICTIONARIES["pt-BR"], [resolvedLanguage]);
  const fallbackDict = DICTIONARIES["pt-BR"];

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = resolvedLanguage;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    }
  }, [resolvedLanguage, isRtl]);

  const setLanguageSetting = useCallback(
    async (setting: LanguageSetting, syncToProfile: boolean = true) => {
      setLanguageSettingState(setting);
      try {
        localStorage.setItem(STORAGE_KEY, setting);
      } catch {
        // ignore
      }

      if (syncToProfile && supabase) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from("profiles")
              .update({ language: setting })
              .eq("id", user.id);
          }
        } catch {
          // ignore
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted || !data?.user) return;
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", data.user.id)
          .maybeSingle();

        if (prof?.language && mounted) {
          const userLang = prof.language as LanguageSetting;
          if (
            userLang === "system" ||
            LANGUAGE_OPTIONS.some((o) => o.code === userLang)
          ) {
            setLanguageSettingState(userLang);
            localStorage.setItem(STORAGE_KEY, userLang);
          }
        }
      } catch {
        // ignore
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const t = useCallback(
    (
      path: string,
      params?: Record<string, string | number> | Array<string | number>,
      fallback?: string
    ): string => {
      let result = typeof (dict as any)[path] === "string" ? (dict as any)[path] : undefined;
      if (result === undefined) {
        result = getNestedValue(dict, path);
      }
      if (result === undefined) {
        result = typeof (fallbackDict as any)[path] === "string" ? (fallbackDict as any)[path] : undefined;
      }
      if (result === undefined) {
        result = getNestedValue(fallbackDict, path);
      }
      if (result === undefined) {
        result = fallback !== undefined ? fallback : path;
      }

      return formatI18nString(result, params);
    },
    [dict, fallbackDict]
  );

  const value = useMemo(
    () => ({
      languageSetting,
      resolvedLanguage,
      isRtl,
      dict,
      setLanguageSetting,
      t,
      languages: LANGUAGE_OPTIONS,
    }),
    [languageSetting, resolvedLanguage, isRtl, dict, setLanguageSetting, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
