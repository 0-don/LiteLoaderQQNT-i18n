import { render } from "preact";
import { useState } from "preact/hooks";
import iconSvg from "../../../res/icon.svg";
import { SOURCE_LANG } from "../../shared/constants";
import { CHAT_EDITOR_SELECTOR, CHAT_TOOLBAR_SELECTOR } from "../../shared/selectors";
import { store } from "../store";

const BUTTON_ID = "liteloaderqqnt-i18n-translate-btn";

async function handleTranslate(
  setLoading: (v: boolean) => void
): Promise<void> {
  const editor = document.querySelector<HTMLElement>(CHAT_EDITOR_SELECTOR);
  if (!editor) return;

  const text = editor.textContent?.trim();
  if (!text) return;

  const state = store.getState();
  const apiUrl = state.apiUrl;
  if (!apiUrl) {
    console.warn("[liteloaderqqnt-i18n] No API URL configured");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${apiUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        source_lang: state.targetLang,
        target_lang: SOURCE_LANG
      })
    });

    const data = await res.json();
    if (data.code === 200 && data.data) {
      editor.focus();
      document.execCommand("selectAll");
      document.execCommand("insertText", false, data.data);
    }
  } catch {
    // Fallback to IPC
    try {
      const data = await window.liteloaderqqnt_i18n.translate(
        text,
        state.targetLang,
        SOURCE_LANG
      );
      if (data.code === 200 && data.data) {
        editor.focus();
        document.execCommand("selectAll");
        document.execCommand("insertText", false, data.data);
      }
    } catch (e) {
      console.error("[liteloaderqqnt-i18n] Translation failed:", e);
    }
  } finally {
    setLoading(false);
  }
}

function ChatButton() {
  const [loading, setLoading] = useState(false);

  return (
    <div id={BUTTON_ID} class="bar-icon normal enable cursor-pointer">
      <div
        class={`icon-item ${loading ? "opacity-50" : ""}`}
        role="button"
        tabIndex={-1}
        aria-label="Translate input"
        onClick={() => handleTranslate(setLoading)}
      >
        <span
          class="flex w-5 h-5"
          dangerouslySetInnerHTML={{ __html: iconSvg }}
        />
      </div>
    </div>
  );
}

let observer: MutationObserver | null = null;

export function initChatButton(): void {
  observer = new MutationObserver(() => injectButton());
  observer.observe(document.body, { childList: true, subtree: true });
  injectButton();
}

function injectButton(): void {
  const toolbar = document.querySelector(CHAT_TOOLBAR_SELECTOR);
  if (!toolbar || toolbar.querySelector(`#${BUTTON_ID}`)) return;

  const container = document.createElement("div");
  toolbar.appendChild(container);
  render(<ChatButton />, container);
}
