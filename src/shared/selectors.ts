// Centralized DOM selectors, attributes, regex patterns, and markers.
// All QQ-specific DOM knowledge lives here so changes to QQ's HTML
// only require updating this single file.

// --- Chinese text detection ---
export const CHINESE_REGEX = /[\u4e00-\u9fff]/;
export const TIMESTAMP_REGEX = /^\d[\d:\/\s.\-]+$/;
export const MAX_TEXT_LENGTH = 200;

// --- Tags to skip entirely ---
export const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "PATH",
  "CODE",
  "PRE"
]);

// --- Elements to never translate (matched via .matches() / .closest()) ---
export const SKIP_SELECTORS = [
  ".user-name",
  ".nick-name",
  ".group-name",
  ".avatar",
  ".emoji",
  ".face-element"
] as const;

// --- Editable elements (skip translation) ---
export const EDITOR_SELECTORS = [
  "[contenteditable='true']",
  ".ProseMirror",
  ".qq-msg-editor"
] as const;

// --- All editable inputs (for context menu targeting) ---
export const EDITABLE_INPUT_SELECTOR =
  "input:not([type='hidden']):not([type='checkbox']):not([type='radio']):not([readonly]):not([disabled]), " +
  "textarea:not([readonly]):not([disabled]), " +
  "[contenteditable='true'], " +
  ".ProseMirror";

// --- Chat content selectors ---
export const CHAT_MESSAGE_SELECTOR = ".message-content";
export const CHAT_PREVIEW_SELECTOR = ".summary-main";

// --- Chat toolbar ---
export const CHAT_TOOLBAR_SELECTOR = "#func-bar-shortcuts-left";
export const CHAT_EDITOR_SELECTOR = ".ProseMirror";

// --- Attributes to translate ---
export const TRANSLATABLE_ATTRS = [
  "placeholder",
  "aria-label",
  "value",
  "data-title",
  "data-description",
  "title"
] as const;

// --- Data attributes we set (markers) ---
export const ATTR = {
  ORIGINAL: "data-i18n-original",
  ACTIVE: "data-i18n-active",
  TITLE: "data-i18n-title",
  attrPrefix: (attr: string) => `data-i18n-attr-${attr}`
} as const;

// --- LiteLoader web component attributes ---
export const LL_ATTR = {
  IS_ACTIVE: "is-active",
  IS_SELECTED: "is-selected",
  IS_COLLAPSIBLE: "is-collapsible",
  IS_DISABLED: "is-disabled"
} as const;
