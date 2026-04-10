import i18next from "i18next";
import { initReactI18next } from "preact-i18next";
import de from "../../i18n/de.json";
import en from "../../i18n/en.json";
import { store } from "../store";

// Map DeepL language codes to i18next locale codes
const LANG_MAP: Record<string, string> = {
  EN: "en",
  ZH: "zh",
  DE: "de",
};

export async function initI18n() {
  const { targetLang } = store.getState();
  const lng = LANG_MAP[targetLang] ?? "en";

  await i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      // zh uses the Chinese keys directly (no translation needed for Chinese UI)
    },
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

  // Update i18next language when target language changes
  store.subscribe((current, previous) => {
    if (current.targetLang !== previous.targetLang) {
      const newLng = LANG_MAP[current.targetLang] ?? "en";
      i18next.changeLanguage(newLng);
    }
  });
}
