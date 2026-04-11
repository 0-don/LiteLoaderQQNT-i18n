import {
  ATTR,
  CHAT_MESSAGE_SELECTOR,
  CHAT_PREVIEW_SELECTOR,
  CHINESE_REGEX,
  EDITOR_SELECTORS,
  MAX_TEXT_LENGTH,
  SKIP_SELECTORS,
  SKIP_TAGS,
  TIMESTAMP_REGEX
} from "../../shared/selectors";
import { store } from "../store";

export function shouldTranslate(element: Element, text: string): boolean {
  // Empty text
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Single char is usually noise, but allow it inside dropdown/menu lists
  if (trimmed.length < 2 && !element.closest(".q-pulldown-menu-list")) {
    return false;
  }

  // Skip tags
  if (SKIP_TAGS.has(element.tagName)) return false;

  // Skip editable elements (inputs, textareas, contenteditable)
  if (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    EDITOR_SELECTORS.some(
      (s) => element.matches(s) || element.closest(s)
    )
  )
    return false;

  // Timestamps and pure numbers
  if (TIMESTAMP_REGEX.test(trimmed)) return false;
  if (/^\d+$/.test(trimmed)) return false;

  // Skip elements matching known non-translatable selectors
  for (const selector of SKIP_SELECTORS) {
    if (element.matches(selector) || element.closest(selector)) return false;
  }

  const state = store.getState();

  // Chat message bodies (only if user opted in)
  if (element.closest(CHAT_MESSAGE_SELECTOR)) {
    return state.translateChatMessages;
  }

  // Chat previews in sidebar
  if (element.closest(CHAT_PREVIEW_SELECTOR)) {
    return state.translateChatPreviews;
  }

  // Long text is likely chat content, not UI labels
  if (trimmed.length > MAX_TEXT_LENGTH && !state.translateChatMessages) {
    return false;
  }

  // UI labels
  return state.translateUILabels;
}

export function isTextLeaf(element: Element): boolean {
  // Element must have text content but no child elements with text
  if (!element.textContent?.trim()) return false;

  for (const child of element.children) {
    if (child.textContent?.trim()) return false;
  }

  return true;
}

/**
 * Check if element has direct text nodes with Chinese content,
 * even if it also has child elements (like dropdown triggers with icons).
 */
export function hasDirectChineseText(element: Element): boolean {
  if (element.hasAttribute(ATTR.ORIGINAL)) return false;

  for (const node of element.childNodes) {
    if (
      node.nodeType === Node.TEXT_NODE &&
      node.textContent?.trim() &&
      CHINESE_REGEX.test(node.textContent)
    ) {
      return true;
    }
  }
  return false;
}
