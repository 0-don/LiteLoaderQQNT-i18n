import type { LangCode } from "./constants";

export interface PluginConfig {
  enabled: boolean;
  targetLang: LangCode;
  apiUrl: string;
  translateUILabels: boolean;
  translateChatPreviews: boolean;
  translateChatMessages: boolean;
  maxConcurrency: number;
}

export interface TranslationResponse {
  code: number;
  data: string;
  alternatives?: string[];
}

export interface QqI18nApi {
  getConfig: () => Promise<PluginConfig>;
  setConfig: (config: PluginConfig) => Promise<void>;
  translate: (
    text: string,
    sourceLang: LangCode,
    targetLang: LangCode
  ) => Promise<TranslationResponse>;
  log: (...args: unknown[]) => Promise<void>;
}

declare global {
  interface Window {
    liteloaderqqnt_i18n: QqI18nApi;
  }
  const LiteLoader: {
    plugins: Record<
      string,
      {
        manifest: { version: string; name: string; slug: string };
        path: { plugin: string; data: string };
        disabled: boolean;
      }
    >;
  };
}
