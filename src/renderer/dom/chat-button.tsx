import { render } from "preact";
import { useState } from "preact/hooks";
import iconSvg from "../../../res/icon.svg";
import { CHAT_EDITOR_SELECTOR, CHAT_TOOLBAR_SELECTOR } from "../../shared/selectors";
import { findEditableAncestor, toggleTranslateInput } from "./context-menu";

const BUTTON_ID = "liteloaderqqnt-i18n-translate-btn";

async function handleTranslate(
  setLoading: (v: boolean) => void
): Promise<void> {
  const editor = document.querySelector<HTMLElement>(CHAT_EDITOR_SELECTOR);
  if (!editor) return;

  const target = findEditableAncestor(editor);
  if (!target) return;

  const text = target.textContent?.trim();
  if (!text) return;

  setLoading(true);
  try {
    await toggleTranslateInput(target);
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
