import { DEBOUNCE_MS, SKIP_TAGS } from "../../shared/constants";
import { getCached } from "../engine/cache";
import { translate } from "../engine/translator";
import { store } from "../store";
import { isTextLeaf, shouldTranslate } from "./classifier";
import { replaceText, restoreAll } from "./replacer";

let observer: MutationObserver | null = null;
let isReplacing = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingNodes: Node[] = [];

function processElement(element: Element): void {
  if (!isTextLeaf(element)) return;

  const text = element.textContent?.trim();
  if (!text) return;
  if (!shouldTranslate(element, text)) return;

  const state = store.getState();

  // Try synchronous cache hit first (no flicker)
  const cached = getCached(text, state.sourceLang, state.targetLang);
  if (cached) {
    isReplacing = true;
    replaceText(element, text, cached);
    isReplacing = false;
    return;
  }

  // Queue for async translation
  translate(text, "ui")
    .then((translated) => {
      // Element might have been removed from DOM by now
      if (!element.isConnected) return;
      // Might have already been translated by another path
      if (element.hasAttribute("data-i18n-original")) return;

      isReplacing = true;
      replaceText(element, text, translated);
      isReplacing = false;
    })
    .catch(() => {
      // Translation failed, leave original text
    });
}

function walkNode(node: Node): void {
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

  // Process this element if it's a text leaf
  processElement(element);

  // Walk children
  for (const child of element.children) {
    walkNode(child);
  }
}

function flushPendingNodes(): void {
  debounceTimer = null;
  const nodes = pendingNodes;
  pendingNodes = [];

  for (const node of nodes) {
    walkNode(node);
  }
}

function onMutation(mutations: MutationRecord[]): void {
  if (isReplacing) return;
  if (!store.getState().enabled) return;

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      pendingNodes.push(node);
    }

    // characterData changes (text content updated)
    if (mutation.type === "characterData" && mutation.target.parentElement) {
      pendingNodes.push(mutation.target.parentElement);
    }
  }

  if (pendingNodes.length === 0) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushPendingNodes, DEBOUNCE_MS);
}

export function startObserver(): void {
  if (observer) return;

  observer = new MutationObserver(onMutation);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  console.log("[qq-i18n] Observer started");
}

export function stopObserver(): void {
  if (!observer) return;
  observer.disconnect();
  observer = null;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingNodes = [];

  console.log("[qq-i18n] Observer stopped");
}

export function scanFullDocument(): void {
  console.log("[qq-i18n] Full document scan...");
  walkNode(document.body);
}

export function toggleTranslation(enabled: boolean): void {
  if (enabled) {
    startObserver();
    scanFullDocument();
  } else {
    stopObserver();
    restoreAll();
  }
}
