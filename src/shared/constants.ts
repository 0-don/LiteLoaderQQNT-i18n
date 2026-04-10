import type { PluginConfig } from "./types";

export const SLUG = "qq_i18n";

export const IPC = {
  GET_CONFIG: `LiteLoader.${SLUG}.getConfig`,
  SET_CONFIG: `LiteLoader.${SLUG}.setConfig`,
  TRANSLATE: `LiteLoader.${SLUG}.translate`,
  LOG: `LiteLoader.${SLUG}.log`,
} as const;

export const DEFAULT_API_URL =
  "";

export const DEFAULT_CONFIG: PluginConfig = {
  enabled: true,
  sourceLang: "ZH",
  targetLang: "EN",
  apiUrl: DEFAULT_API_URL,
  translateUILabels: true,
  translateChatPreviews: true,
  translateChatMessages: false,
  maxConcurrency: 3,
};

export const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "PATH",
  "CODE",
  "PRE",
]);

export const SKIP_SELECTORS = [
  ".user-name",
  ".nick-name",
  ".group-name",
  ".avatar",
  ".emoji",
  ".face-element",
] as const;

export const CHAT_MESSAGE_SELECTOR = ".message-content";

export const TIMESTAMP_REGEX = /^\d[\d:\/\s.\-]+$/;

export const MAX_TEXT_LENGTH = 200;

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
  { code: "TR", label: "Turkish" },
] as const;
