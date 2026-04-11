import { BATCH_DELAY_MS, SOURCE_LANG, type LangCode } from "../../shared/constants";
import { store } from "../store";
import { callTranslateApi } from "./api";
import { getCached, putCache } from "./cache";

interface PendingRequest {
  text: string;
  resolvers: Array<(translated: string) => void>;
  rejecters: Array<(error: Error) => void>;
}

const pending = new Map<string, PendingRequest>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let activeRequests = 0;
let backoffMs = 0;

export function translate(text: string): Promise<string> {
  const { targetLang } = store.getState();

  // Check cache first (synchronous)
  const cached = getCached(text, targetLang);
  if (cached) {
    store.getState().incrementStat("cacheHits");
    return Promise.resolve(cached);
  }

  store.getState().incrementStat("cacheMisses");

  // Check if already pending
  const existing = pending.get(text);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.resolvers.push(resolve);
      existing.rejecters.push(reject);
    });
  }

  // Enqueue
  return new Promise((resolve, reject) => {
    pending.set(text, {
      text,
      resolvers: [resolve],
      rejecters: [reject]
    });
    store.getState().setQueueLength(pending.size);
    scheduleBatch();
  });
}

function scheduleBatch() {
  if (batchTimer) return;
  batchTimer = setTimeout(() => {
    batchTimer = null;
    processBatch();
  }, BATCH_DELAY_MS + backoffMs);
}

async function processBatch() {
  const { targetLang, maxConcurrency } = store.getState();
  const entries = [...pending.entries()];

  for (const [text, request] of entries) {
    if (activeRequests >= maxConcurrency) {
      scheduleBatch();
      return;
    }

    pending.delete(text);
    store.getState().setQueueLength(pending.size);
    activeRequests++;

    callTranslateApi(text, SOURCE_LANG, targetLang)
      .then(async (translated) => {
        activeRequests--;
        backoffMs = 0;
        await putCache(text, translated, targetLang);
        store.getState().incrementStat("apiCalls");
        for (const resolve of request.resolvers) resolve(translated);
        if (pending.size > 0) scheduleBatch();
      })
      .catch((error) => {
        activeRequests--;
        store.getState().incrementStat("apiErrors");

        // Exponential backoff
        backoffMs = Math.min((backoffMs || 1000) * 2, 30000);
        console.warn(
          `[liteloaderqqnt-i18n] API error, backoff ${backoffMs}ms:`,
          error.message
        );

        for (const reject of request.rejecters) reject(error);
        if (pending.size > 0) scheduleBatch();
      });
  }
}

