import { store } from "../store";

let translatedCount = 0;

export function replaceText(
  element: Element,
  original: string,
  translated: string
): void {
  element.setAttribute("data-i18n-original", original);
  element.setAttribute("data-i18n-active", "true");

  // Replace only direct text nodes, preserve child elements
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      node.textContent = translated;
    }
  }

  translatedCount++;
  store.getState().setTranslatedElements(translatedCount);
}

export function restoreElement(element: Element): void {
  const original = element.getAttribute("data-i18n-original");
  if (!original) return;

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      node.textContent = original;
    }
  }

  element.removeAttribute("data-i18n-original");
  element.removeAttribute("data-i18n-active");
  translatedCount--;
  store.getState().setTranslatedElements(Math.max(0, translatedCount));
}

export function restoreAll(): void {
  const elements = document.querySelectorAll("[data-i18n-active]");
  for (const el of elements) {
    restoreElement(el);
  }
  translatedCount = 0;
  store.getState().setTranslatedElements(0);
}

export function getTranslatedCount(): number {
  return translatedCount;
}
