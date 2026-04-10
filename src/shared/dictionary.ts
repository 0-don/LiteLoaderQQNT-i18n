// Static translation dictionaries loaded from i18n JSON files.
// Bun bundles these at build time. Keys are Chinese text, values are translations.
// To add a language: create src/i18n/{code}.json and add it here.

import de from "../i18n/de.json";
import en from "../i18n/en.json";
import type { LangCode } from "./constants";

/** All available locale dictionaries, keyed by language code. */
export const DICTIONARIES: Partial<Record<LangCode, Record<string, string>>> = {
  EN: en,
  DE: de
};

export function getStaticTranslation(
  text: string,
  targetLang: LangCode
): string | null {
  return DICTIONARIES[targetLang]?.[text] ?? null;
}

export function getStaticDictionary(
  targetLang: LangCode
): Record<string, string> | null {
  return DICTIONARIES[targetLang] ?? null;
}
