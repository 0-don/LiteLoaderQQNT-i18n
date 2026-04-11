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

export function findEditableAncestor(target: EventTarget | null): HTMLElement | null {
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
  // contenteditable / ProseMirror: replace only text nodes, preserve images/embeds
  replaceTextNodes(el, text);
}

function replaceTextNodes(el: HTMLElement, text: string): void {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.textContent?.trim()) textNodes.push(node);
  }

  if (textNodes.length === 0) return;

  // Put all translated text into the first text node, clear the rest
  textNodes[0].textContent = text;
  for (let i = 1; i < textNodes.length; i++) {
    textNodes[i].textContent = "";
  }
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

const ATTR_ORIGINAL_HTML = "data-i18n-input-original-html";

export async function toggleTranslateInput(el: HTMLElement): Promise<void> {
  if (el.hasAttribute(ATTR_ORIGINAL)) {
    // Restore: use saved HTML for contenteditable (preserves images), plain text for inputs
    const isContentEditable =
      !(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement);
    if (isContentEditable && el.hasAttribute(ATTR_ORIGINAL_HTML)) {
      el.innerHTML = el.getAttribute(ATTR_ORIGINAL_HTML)!;
      el.removeAttribute(ATTR_ORIGINAL_HTML);
    } else {
      setInputText(el, el.getAttribute(ATTR_ORIGINAL)!);
    }
    el.removeAttribute(ATTR_ORIGINAL);
    return;
  }

  const text = getInputText(el);
  if (!text) return;

  const { src, tgt } = detectDirection(text);
  el.setAttribute(ATTR_ORIGINAL, text);

  // Save full HTML for contenteditable so we can restore images/embeds
  const isContentEditable =
    !(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement);
  if (isContentEditable) {
    el.setAttribute(ATTR_ORIGINAL_HTML, el.innerHTML);
  }

  try {
    const translated = await callTranslateApi(text, src, tgt);
    setInputText(el, translated);
  } catch (err) {
    console.error("[liteloaderqqnt-i18n] Translate failed:", err);
    el.removeAttribute(ATTR_ORIGINAL);
    el.removeAttribute(ATTR_ORIGINAL_HTML);
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

  clone.addEventListener("click", () => {
    menu.remove();
    toggleTranslateInput(inputEl);
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

  // Ctrl+Shift+T to translate focused input (works even without context menu)
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey && e.shiftKey && e.key === "T")) return;
    const focused = findEditableAncestor(document.activeElement);
    if (!focused) return;
    e.preventDefault();
    toggleTranslateInput(focused);
  });
}
