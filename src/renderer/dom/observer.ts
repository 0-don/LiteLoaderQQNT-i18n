import { DEBOUNCE_MS } from "../../shared/constants";
import { restoreAll } from "./replacer";
import { isReplacing, walkNode } from "./walker";
import { store } from "../store";

let observer: MutationObserver | null = null;
const shadowObservers: MutationObserver[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingNodes: Node[] = [];

function observeShadow(root: ShadowRoot): void {
  if (!observer) return;
  if ((root as any).__i18nObserved) return;
  (root as any).__i18nObserved = true;

  const shadowObs = new MutationObserver(onMutation);
  shadowObs.observe(root, {
    childList: true,
    subtree: true,
    characterData: true
  });
  shadowObservers.push(shadowObs);
}

function flushPendingNodes(): void {
  debounceTimer = null;
  const nodes = pendingNodes;
  pendingNodes = [];

  for (const node of nodes) {
    walkNode(node, observeShadow);
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
    characterData: true
  });

  console.log("[liteloaderqqnt-i18n] Observer started");
}

export function stopObserver(): void {
  if (!observer) return;
  observer.disconnect();
  observer = null;

  for (const obs of shadowObservers) obs.disconnect();
  shadowObservers.length = 0;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingNodes = [];

  console.log("[liteloaderqqnt-i18n] Observer stopped");
}

export function scanFullDocument(): void {
  console.log("[liteloaderqqnt-i18n] Full document scan...");
  walkNode(document.body, observeShadow);
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
