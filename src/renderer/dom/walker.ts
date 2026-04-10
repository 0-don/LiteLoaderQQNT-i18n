import {
  ATTR,
  CHINESE_REGEX,
  SKIP_TAGS,
  TRANSLATABLE_ATTRS
} from "../../shared/selectors";
import { getCached } from "../engine/cache";
import { translate } from "../engine/translator";
import { store } from "../store";
import {
  hasDirectChineseText,
  isTextLeaf,
  shouldTranslate
} from "./classifier";
import { patchInputValue, replaceAttr, replaceText } from "./replacer";

export let isReplacing = false;

function processElement(element: Element): void {
  // Strict text leaf (no child elements with text)
  if (isTextLeaf(element)) {
    translateElement(element);
    return;
  }

  // Elements with direct Chinese text nodes alongside child elements
  if (hasDirectChineseText(element)) {
    translateElement(element);
  }
}

function translateElement(element: Element): void {
  // Get only direct text node content (not child element text)
  const directText = getDirectText(element);
  if (!directText) return;

  // If already marked as translated, check if Vue reverted the text
  if (element.hasAttribute(ATTR.ORIGINAL)) {
    if (CHINESE_REGEX.test(directText)) {
      // Current text is Chinese again — Vue overwrote our translation
      element.removeAttribute(ATTR.ORIGINAL);
      element.removeAttribute(ATTR.ACTIVE);
    } else {
      return;
    }
  }

  if (!shouldTranslate(element, directText)) return;

  const state = store.getState();

  // Try synchronous cache hit first (no flicker)
  const cached = getCached(directText, state.targetLang);
  if (cached) {
    isReplacing = true;
    replaceText(element, directText, cached);
    isReplacing = false;
    return;
  }

  // Queue for async translation
  translate(directText)
    .then((translated) => {
      if (!element.isConnected) return;
      isReplacing = true;
      replaceText(element, directText, translated);
      isReplacing = false;
    })
    .catch(() => {});
}

/** Extract trimmed text from direct text nodes only (skip child element text) */
function getDirectText(element: Element): string {
  let text = "";
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || "";
    }
  }
  return text.trim();
}

function processAttributes(element: Element): void {
  const state = store.getState();

  for (const attr of TRANSLATABLE_ATTRS) {
    // Only translate value on readonly inputs (dropdown display values)
    if (attr === "value" && !element.hasAttribute("readonly")) continue;

    // Skip title we added ourselves as hover tooltip (shows original text)
    if (attr === "title" && element.hasAttribute(ATTR.TITLE)) continue;

    // Patch readonly input .value setter for future Vue updates
    if (attr === "value" && element instanceof HTMLInputElement) {
      patchInputValue(
        element,
        translate,
        getCached,
        () => store.getState().targetLang
      );
    }

    const value = element.getAttribute(attr);
    if (!value || value.length < 2) continue;

    // If already marked but Vue reverted the value to Chinese, clear marker
    const markerAttr = ATTR.attrPrefix(attr);
    if (element.hasAttribute(markerAttr)) {
      if (CHINESE_REGEX.test(value)) {
        element.removeAttribute(markerAttr);
      } else {
        continue;
      }
    }

    if (!CHINESE_REGEX.test(value)) continue;

    const cached = getCached(value, state.targetLang);
    if (cached) {
      isReplacing = true;
      replaceAttr(element, attr, value, cached);
      isReplacing = false;
      continue;
    }

    translate(value)
      .then((translated) => {
        if (!element.isConnected) return;
        if (element.hasAttribute(markerAttr)) return;
        isReplacing = true;
        replaceAttr(element, attr, value, translated);
        isReplacing = false;
      })
      .catch(() => {});
  }
}

export function walkNode(
  node: Node,
  onShadowRoot?: (root: ShadowRoot) => void
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (parent && !SKIP_TAGS.has(parent.tagName)) {
      processElement(parent);
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  if (SKIP_TAGS.has(element.tagName)) return;

  // Process text content
  processElement(element);

  // Process translatable attributes
  processAttributes(element);

  // Walk into shadow DOM if present
  if (element.shadowRoot) {
    onShadowRoot?.(element.shadowRoot);
    for (const child of element.shadowRoot.children) {
      walkNode(child, onShadowRoot);
    }
  }

  // Walk children
  for (const child of element.children) {
    walkNode(child, onShadowRoot);
  }
}
