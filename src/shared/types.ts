export interface PluginConfig {
  enabled: boolean;
  sourceLang: string;
  targetLang: string;
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

export interface TranslationRequest {
  text: string;
  priority: "ui" | "chat";
}

export interface CacheEntry {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export interface QqI18nApi {
  getConfig: () => Promise<PluginConfig>;
  setConfig: (config: PluginConfig) => Promise<void>;
  translate: (
    text: string,
    sourceLang: string,
    targetLang: string
  ) => Promise<TranslationResponse>;
  log: (...args: unknown[]) => Promise<void>;
}

declare global {
  interface Window {
    qq_i18n: QqI18nApi;
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
    path: {
      root: string;
      profile: string;
      data: string;
      plugins: string;
    };
    versions: {
      liteloader: string;
      qqnt: string;
      electron: string;
      node: string;
      chrome: string;
    };
    os: { platform: string };
    api: {
      config: {
        get: (slug: string, defaults: unknown) => unknown;
        set: (slug: string, config: unknown) => boolean;
      };
      openExternal: (url: string) => boolean;
      openPath: (path: string) => boolean;
    };
  };
}
