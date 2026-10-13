import { ptBR } from "./pt-BR";
import { ptPT } from "./pt-PT";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";
import { it } from "./it";
import { ar } from "./ar";
import { id } from "./id";
import { ja } from "./ja";
import { ko } from "./ko";
import { nl } from "./nl";
import { ru } from "./ru";
import { vi } from "./vi";
import { zhCN } from "./zh-CN";
import type { SupportedLanguage, TranslationDictionary } from "../types";

export const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  "pt-BR": ptBR,
  "pt-PT": ptPT,
  en,
  es,
  fr,
  de,
  it,
  ar,
  id,
  ja,
  ko,
  nl,
  ru,
  vi,
  "zh-CN": zhCN,
};

export { ptBR, ptPT, en, es, fr, de, it, ar, id, ja, ko, nl, ru, vi, zhCN };
