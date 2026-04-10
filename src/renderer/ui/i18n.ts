import { useSyncExternalStore } from "preact/compat";
import type { TranslationKey } from "../../i18n/i18n.d";
import { DICTIONARIES } from "../../shared/dictionary";
import { store } from "../store";

export function useTranslation() {
  const lang = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getState().targetLang
  );
  return {
    t: (key: TranslationKey) => (DICTIONARIES[lang]?.[key] ?? key) as string
  };
}
