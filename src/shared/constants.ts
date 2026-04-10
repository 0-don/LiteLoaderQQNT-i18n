import type { PluginConfig } from "./types";

export const SLUG = "liteloaderqqnt-i18n";
export const SLUG_UNDERSCORE = "liteloaderqqnt_i18n";

export const IPC = {
  GET_CONFIG: `LiteLoader.${SLUG}.getConfig`,
  SET_CONFIG: `LiteLoader.${SLUG}.setConfig`,
  TRANSLATE: `LiteLoader.${SLUG}.translate`,
  LOG: `LiteLoader.${SLUG}.log`
} as const;

export const DEFAULT_API_URL = "https://deepl.mukapp.top";

export const SOURCE_LANG: LangCode = "ZH";

export const DEFAULT_CONFIG: PluginConfig = {
  enabled: true,
  targetLang: "EN",
  apiUrl: DEFAULT_API_URL,
  translateUILabels: true,
  translateChatPreviews: true,
  translateChatMessages: false,
  maxConcurrency: 3
};

export const BATCH_DELAY_MS = 150;

export const DEBOUNCE_MS = 50;

export const SUPPORTED_LANGUAGES = [
  { code: "ZH", label: "Chinese (Simplified)" },
  { code: "EN", label: "English" },
  { code: "DE", label: "German" },
  { code: "FR", label: "French" },
  { code: "ES", label: "Spanish" },
  { code: "JA", label: "Japanese" },
  { code: "KO", label: "Korean" },
  { code: "RU", label: "Russian" },
  { code: "PT", label: "Portuguese" },
  { code: "IT", label: "Italian" },
  { code: "NL", label: "Dutch" },
  { code: "PL", label: "Polish" },
  { code: "TR", label: "Turkish" }
] as const;

export type LangCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
