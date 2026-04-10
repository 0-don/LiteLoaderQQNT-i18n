import { get, set, keys, del, createStore } from "idb-keyval";
import { getStaticTranslation } from "../../shared/dictionary";

const idbStore = createStore("qq-i18n-cache", "translations");

// In-memory hot cache for synchronous lookups
const memoryCache = new Map<string, string>();

function cacheKey(
  text: string,
  sourceLang: string,
  targetLang: string
): string {
  return `${sourceLang}:${targetLang}:${text}`;
}

export async function initCache(
  sourceLang: string,
  targetLang: string
): Promise<void> {
  // Load static dictionary (JSON, bundled at build time) into memory
  const { getStaticDictionary } = await import("../../shared/dictionary");
  const dict = getStaticDictionary(sourceLang, targetLang);
  if (dict) {
    for (const [original, translated] of Object.entries(dict)) {
      const key = cacheKey(original, sourceLang, targetLang);
      memoryCache.set(key, translated);
    }
  }

  // Load IndexedDB entries into memory
  const allKeys = await keys(idbStore);
  const prefix = `${sourceLang}:${targetLang}:`;
  for (const k of allKeys) {
    const keyStr = String(k);
    if (keyStr.startsWith(prefix)) {
      const value = await get<string>(k, idbStore);
      if (value) memoryCache.set(keyStr, value);
    }
  }

  console.log(`[qq-i18n] Cache loaded: ${memoryCache.size} entries`);
}

export function getCached(
  text: string,
  sourceLang: string,
  targetLang: string
): string | null {
  // Check memory cache first (synchronous)
  const key = cacheKey(text, sourceLang, targetLang);
  const cached = memoryCache.get(key);
  if (cached) return cached;

  // Check static dictionary
  const staticResult = getStaticTranslation(text, sourceLang, targetLang);
  if (staticResult) {
    memoryCache.set(key, staticResult);
    return staticResult;
  }

  return null;
}

export async function putCache(
  text: string,
  translated: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  const key = cacheKey(text, sourceLang, targetLang);
  memoryCache.set(key, translated);
  await set(key, translated, idbStore);
}

export async function getCacheSize(): Promise<number> {
  return (await keys(idbStore)).length;
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
