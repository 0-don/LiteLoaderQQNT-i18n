import type { LangCode } from "../../shared/constants";
import { store } from "../store";

// --- Provider implementations ---

async function tryDeepLX(
  url: string,
  text: string,
  srcLang: LangCode,
  tgtLang: LangCode
): Promise<string> {
  const res = await fetch(`${url}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source_lang: srcLang,
      target_lang: tgtLang
    })
  });
  const data = await res.json();
  if (data.code === 200 && data.data) {
    if (!isValidTranslation(text, data.data))
      throw new Error("DeepLX returned invalid translation");
    return data.data;
  }
  throw new Error(data.message || `DeepLX returned code ${data.code}`);
}

const GOOGLE_LANG_MAP: Record<string, string> = {
  ZH: "zh-CN",
  EN: "en",
  DE: "de",
  FR: "fr",
  ES: "es",
  JA: "ja",
  KO: "ko",
  RU: "ru",
  PT: "pt",
  IT: "it",
  NL: "nl",
  PL: "pl",
  TR: "tr"
};

async function tryGoogle(
  text: string,
  srcLang: LangCode,
  tgtLang: LangCode
): Promise<string> {
  const sl = GOOGLE_LANG_MAP[srcLang] ?? srcLang.toLowerCase();
  const tl = GOOGLE_LANG_MAP[tgtLang] ?? tgtLang.toLowerCase();
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  // Response: [[["translated text","original text",...],...],...]
  if (!Array.isArray(data?.[0])) throw new Error("Unexpected Google response");
  const result = data[0].map((seg: any[]) => seg[0]).join("");
  if (!isValidTranslation(text, result))
    throw new Error("Google returned invalid translation");
  return result;
}

const LINGVA_LANG_MAP: Record<string, string> = {
  ZH: "zh",
  ...GOOGLE_LANG_MAP
};

async function tryLingva(
  instance: string,
  text: string,
  srcLang: LangCode,
  tgtLang: LangCode
): Promise<string> {
  const sl = LINGVA_LANG_MAP[srcLang] ?? srcLang.toLowerCase();
  const tl = LINGVA_LANG_MAP[tgtLang] ?? tgtLang.toLowerCase();
  const url = `${instance}/api/v1/${sl}/${tl}/${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.translation) {
    if (!isValidTranslation(text, data.translation))
      throw new Error("Lingva returned invalid translation");
    return data.translation;
  }
  throw new Error(data.error || "Lingva returned no translation");
}

function isValidTranslation(text: string, result: string): boolean {
  // Reject URLs returned as "translations" (known DeepLX spam response)
  if (/^https?:\/\//.test(result.trim())) return false;
  // Reject if result is identical to input (no translation happened)
  if (result.trim() === text.trim()) return false;
  return true;
}

// --- Fallback chain ---

interface Provider {
  name: string;
  call: (text: string, src: LangCode, tgt: LangCode) => Promise<string>;
}

const FALLBACK_PROVIDERS: Provider[] = [
  {
    name: "DeepLX (mukapp)",
    call: (t, s, g) => tryDeepLX("https://deepl.mukapp.top", t, s, g)
  },
  {
    name: "DeepLX (official)",
    call: (t, s, g) => tryDeepLX("https://api.deeplx.org", t, s, g)
  },
  { name: "Google Translate", call: tryGoogle },
  {
    name: "Lingva (ml)",
    call: (t, s, g) => tryLingva("https://lingva.ml", t, s, g)
  },
  {
    name: "Lingva (plausibility)",
    call: (t, s, g) =>
      tryLingva("https://translate.plausibility.cloud", t, s, g)
  }
];

export async function callTranslateApi(
  text: string,
  srcLang: LangCode,
  tgtLang: LangCode
): Promise<string> {
  const { apiUrl } = store.getState();

  // User's configured API first (DeepLX format)
  try {
    return await tryDeepLX(apiUrl, text, srcLang, tgtLang);
  } catch {}

  // Try fallback providers
  let lastError: Error | null = null;

  for (const provider of FALLBACK_PROVIDERS) {
    try {
      return await provider.call(text, srcLang, tgtLang);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // IPC as last resort
  try {
    const data = await window.liteloaderqqnt_i18n.translate(
      text,
      srcLang,
      tgtLang
    );
    if (data.code === 200 && data.data) return data.data;
    throw new Error(`IPC returned code ${data.code}`);
  } catch (err) {
    throw lastError ?? err;
  }
}
