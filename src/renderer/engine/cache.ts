import { createStore, del, get, keys, set } from "idb-keyval";
import { SOURCE_LANG, type LangCode } from "../../shared/constants";
import { getStaticDictionary, getStaticTranslation } from "../../shared/dictionary";

const idbStore = createStore("liteloaderqqnt-i18n-cache", "translations");

// In-memory hot cache for synchronous lookups
const memoryCache = new Map<string, string>();

function cacheKey(text: string, targetLang: LangCode): string {
  return `${SOURCE_LANG}:${targetLang}:${text}`;
}

export async function initCache(targetLang: LangCode): Promise<void> {
  // Load static dictionary (JSON, bundled at build time) into memory
  const dict = getStaticDictionary(targetLang);
  if (dict) {
    for (const [original, translated] of Object.entries(dict)) {
      memoryCache.set(cacheKey(original, targetLang), translated);
    }
  }

  // Load IndexedDB entries into memory
  const allKeys = await keys(idbStore);
  const prefix = `${SOURCE_LANG}:${targetLang}:`;
  for (const k of allKeys) {
    const keyStr = String(k);
    if (keyStr.startsWith(prefix)) {
      const value = await get<string>(k, idbStore);
      if (value) memoryCache.set(keyStr, value);
    }
  }

  console.log(`[liteloaderqqnt-i18n] Cache loaded: ${memoryCache.size} entries`);
}

export function getCached(text: string, targetLang: LangCode): string | null {
  // Check memory cache first (synchronous)
  const key = cacheKey(text, targetLang);
  const cached = memoryCache.get(key);
  if (cached) return cached;

  // Check static dictionary
  const staticResult = getStaticTranslation(text, targetLang);
  if (staticResult) {
    memoryCache.set(key, staticResult);
    return staticResult;
  }

  return null;
}

export async function putCache(
  text: string,
  translated: string,
  targetLang: LangCode
): Promise<void> {
  const key = cacheKey(text, targetLang);
  memoryCache.set(key, translated);
  await set(key, translated, idbStore);
}

export async function clearCache(): Promise<void> {
  const allKeys = await keys(idbStore);
  for (const key of allKeys) {
    await del(key, idbStore);
  }
  memoryCache.clear();
}

export function getMemoryCacheSize(): number {
  return memoryCache.size;
}
