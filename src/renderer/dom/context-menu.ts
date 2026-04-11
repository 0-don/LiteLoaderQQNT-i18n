import iconSvg from "../../../res/icon.svg";
import { SOURCE_LANG, type LangCode } from "../../shared/constants";
import { CHINESE_REGEX, EDITABLE_INPUT_SELECTOR } from "../../shared/selectors";
import { store } from "../store";

const ATTR_ORIGINAL = "data-i18n-input-original";
const MENU_ITEM_ID = "i18n-context-translate";

let capturedInput: HTMLElement | null = null;
let appended = false;

function isEditableElement(el: Element): el is HTMLElement {
  return el.matches(EDITABLE_INPUT_SELECTOR);
}

function findEditableAncestor(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  if (isEditableElement(target)) return target;
  const ancestor = target.closest(EDITABLE_INPUT_SELECTOR);
  return ancestor instanceof HTMLElement ? ancestor : null;
}

function getInputText(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }
  return el.textContent?.trim() ?? "";
}

function setInputText(el: HTMLElement, text: string): void {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  // contenteditable / ProseMirror
  el.focus();
  document.execCommand("selectAll");
  document.execCommand("insertText", false, text);
}

function detectDirection(text: string): { src: LangCode; tgt: LangCode } {
  const { targetLang } = store.getState();
  if (CHINESE_REGEX.test(text)) {
    return { src: SOURCE_LANG, tgt: targetLang };
  }
  return { src: targetLang, tgt: SOURCE_LANG };
}

async function callTranslateApi(
  text: string,
  srcLang: LangCode,
  tgtLang: LangCode
): Promise<string> {
  const { apiUrl } = store.getState();
  try {
    const res = await fetch(`${apiUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        source_lang: srcLang,
        target_lang: tgtLang,
      }),
    });
    const data = await res.json();
    if (data.code === 200 && data.data) return data.data;
    throw new Error(data.message || `API returned code ${data.code}`);
  } catch (err) {
    // IPC fallback
    const data = await window.liteloaderqqnt_i18n.translate(
      text,
      srcLang,
      tgtLang
    );
    if (data.code === 200 && data.data) return data.data;
    throw new Error(`Translation failed: code ${data.code}`);
  }
}

function injectMenuItem(menu: Element, inputEl: HTMLElement): void {
  const firstItem = menu.querySelector(
    ".q-context-menu-item:not([disabled='true'])"
  );
  if (!firstItem) return;

  const clone = firstItem.cloneNode(true) as HTMLElement;
  clone.id = MENU_ITEM_ID;

  // Replace icon
  const iconEl = clone.querySelector(".q-icon");
  if (iconEl) iconEl.innerHTML = iconSvg;

  const hasOriginal = inputEl.hasAttribute(ATTR_ORIGINAL);
  const label = hasOriginal ? "Show Original" : "Translate";

  // Set label text
  const textEl = clone.querySelector(".q-context-menu-item__text");
  if (textEl) {
    textEl.textContent = label;
  } else if (clone.className.includes("q-context-menu-item__text")) {
    clone.textContent = label;
  }

  clone.addEventListener("click", async () => {
    menu.remove();

    if (hasOriginal) {
      // Restore original
      const original = inputEl.getAttribute(ATTR_ORIGINAL)!;
      setInputText(inputEl, original);
      inputEl.removeAttribute(ATTR_ORIGINAL);
      return;
    }

    // Translate
    const text = getInputText(inputEl);
    if (!text) return;

    const { src, tgt } = detectDirection(text);
    inputEl.setAttribute(ATTR_ORIGINAL, text);

    try {
      const translated = await callTranslateApi(text, src, tgt);
      setInputText(inputEl, translated);
    } catch (err) {
      console.error("[liteloaderqqnt-i18n] Context menu translate failed:", err);
      inputEl.removeAttribute(ATTR_ORIGINAL);
    }
  });

  menu.appendChild(clone);
}

export function initContextMenu(): void {
  // Capture the right-clicked editable element
  document.addEventListener(
    "mousedown",
    (e) => {
      if (e.button !== 2) {
        capturedInput = null;
        appended = true;
        return;
      }
      capturedInput = findEditableAncestor(e.target);
      appended = !capturedInput;
    },
    true
  );

  // Watch for QQ's context menu appearing
  new MutationObserver(() => {
    if (appended || !capturedInput) return;

    const menu = document.querySelector(".q-context-menu");
    if (!menu) return;

    // Skip if already injected
    if (menu.querySelector(`#${MENU_ITEM_ID}`)) {
      appended = true;
      return;
    }

    injectMenuItem(menu, capturedInput);
    appended = true;
  }).observe(document.body, { childList: true });
}
