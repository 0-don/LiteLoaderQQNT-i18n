// Static translation dictionaries loaded from i18n JSON files.
// Bun bundles these at build time. Keys are Chinese text, values are translations.
// To add a language: create src/i18n/{langCode}.json and import it here.

import de from "../i18n/de.json";
import en from "../i18n/en.json";

const dictionaries: Record<string, Record<string, string>> = {
  EN: en,
  DE: de,
};

export function getStaticTranslation(
  text: string,
  _sourceLang: string,
  targetLang: string
): string | null {
  return dictionaries[targetLang]?.[text] ?? null;
}

export function getStaticDictionary(
  _sourceLang: string,
  targetLang: string
): Record<string, string> | null {
  return dictionaries[targetLang] ?? null;
}
