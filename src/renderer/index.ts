import { scanFullDocument, startObserver, stopObserver, toggleTranslation } from "./dom/observer";
import { restoreAll } from "./dom/replacer";
import { initCache } from "./engine/cache";
import { store } from "./store";
import { initI18n } from "./ui/i18n";
import { mountSettings } from "./ui/settings";
import { injectStyles } from "./ui/styles";

async function init() {
  // Load config from main process
  await store.getState().loadConfig();
  const state = store.getState();

  // Init i18next for settings UI translations
  await initI18n();

  console.log(
    `[qq-i18n] Initializing: ${state.sourceLang} -> ${state.targetLang}, enabled: ${state.enabled}`
  );

  // Initialize translation cache (loads static dict + IndexedDB into memory)
  await initCache(state.sourceLang, state.targetLang);

  // Inject CSS
  injectStyles();

  // Start translation if enabled
  if (state.enabled) {
    startObserver();
    // Wait for QQ's DOM to be populated before scanning
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => scanFullDocument());
    } else {
      // DOM already loaded, scan after a short delay for Vue to render
      setTimeout(() => scanFullDocument(), 500);
    }
  }

  // React to enable/disable toggle
  store.subscribe((current, previous) => {
    if (current.enabled !== previous.enabled) {
      toggleTranslation(current.enabled);
    }
  });

  // React to language changes (re-init cache and re-scan)
  store.subscribe(async (current, previous) => {
    if (
      current.sourceLang !== previous.sourceLang ||
      current.targetLang !== previous.targetLang
    ) {
      stopObserver();
      restoreAll();
      await initCache(current.sourceLang, current.targetLang);
      if (current.enabled) {
        startObserver();
        scanFullDocument();
      }
    }
  });

  // Re-scan on SPA navigation
  if (typeof navigation !== "undefined") {
    navigation.addEventListener("navigatesuccess", () => {
      if (store.getState().enabled) {
        setTimeout(() => scanFullDocument(), 300);
      }
    });
  }

  console.log("[qq-i18n] Ready");
}

init().catch((err) => console.error("[qq-i18n] Init failed:", err));

// Settings page hook (called by LiteLoader when user opens settings)
export const onSettingWindowCreated = (view: HTMLDivElement) => {
  mountSettings(view);
};
