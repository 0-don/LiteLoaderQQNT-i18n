import { createStore as createZustandStore } from "zustand/vanilla";
import { DEFAULT_CONFIG, type LangCode } from "../shared/constants";
import type { PluginConfig } from "../shared/types";

export interface I18nState extends PluginConfig {
  // Runtime stats
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  apiErrors: number;
  queueLength: number;
  translatedElements: number;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setTargetLang: (lang: LangCode) => void;
  setApiUrl: (url: string) => void;
  setTranslateUILabels: (enabled: boolean) => void;
  setTranslateChatPreviews: (enabled: boolean) => void;
  setTranslateChatMessages: (enabled: boolean) => void;
  incrementStat: (
    stat: "cacheHits" | "cacheMisses" | "apiCalls" | "apiErrors"
  ) => void;
  setQueueLength: (n: number) => void;
  setTranslatedElements: (n: number) => void;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
}

export const store = createZustandStore<I18nState>((set, get) => ({
  ...DEFAULT_CONFIG,

  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
  apiErrors: 0,
  queueLength: 0,
  translatedElements: 0,

  setEnabled: (enabled) => {
    set({ enabled });
    get().saveConfig();
  },
  setTargetLang: (targetLang) => {
    set({ targetLang });
    get().saveConfig();
  },
  setApiUrl: (apiUrl) => {
    set({ apiUrl });
    get().saveConfig();
  },
  setTranslateUILabels: (translateUILabels) => {
    set({ translateUILabels });
    get().saveConfig();
  },
  setTranslateChatPreviews: (translateChatPreviews) => {
    set({ translateChatPreviews });
    get().saveConfig();
  },
  setTranslateChatMessages: (translateChatMessages) => {
    set({ translateChatMessages });
    get().saveConfig();
  },
  incrementStat: (stat) => set((s) => ({ [stat]: s[stat] + 1 })),
  setQueueLength: (queueLength) => set({ queueLength }),
  setTranslatedElements: (translatedElements) => set({ translatedElements }),

  loadConfig: async () => {
    const config = await window.liteloaderqqnt_i18n.getConfig();
    set(config);
  },
  saveConfig: async () => {
    const state = get();
    const config: PluginConfig = {
      enabled: state.enabled,
      targetLang: state.targetLang,
      apiUrl: state.apiUrl,
      translateUILabels: state.translateUILabels,
      translateChatPreviews: state.translateChatPreviews,
      translateChatMessages: state.translateChatMessages,
      maxConcurrency: state.maxConcurrency
    };
    await window.liteloaderqqnt_i18n.setConfig(config);
  }
}));
