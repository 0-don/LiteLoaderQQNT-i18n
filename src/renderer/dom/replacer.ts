import type { LangCode } from "../../shared/constants";
import { ATTR, TRANSLATABLE_ATTRS } from "../../shared/selectors";
import { store } from "../store";

let translatedCount = 0;

export function replaceText(
  element: Element,
  original: string,
  translated: string
): void {
  element.setAttribute(ATTR.ORIGINAL, original);
  element.setAttribute(ATTR.ACTIVE, "true");

  // Show original text on hover if element doesn't already have a title
  if (!element.hasAttribute("title")) {
    element.setAttribute("title", original);
    element.setAttribute(ATTR.TITLE, "true");
  }

  // Replace only direct text nodes, preserve child elements
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      node.textContent = translated;
    }
  }

  translatedCount++;
  store.getState().setTranslatedElements(translatedCount);
}

function restoreElement(element: Element): void {
  const original = element.getAttribute(ATTR.ORIGINAL);
  if (!original) return;

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      node.textContent = original;
    }
  }

  element.removeAttribute(ATTR.ORIGINAL);
  element.removeAttribute(ATTR.ACTIVE);

  // Remove title we added
  if (element.hasAttribute(ATTR.TITLE)) {
    element.removeAttribute("title");
    element.removeAttribute(ATTR.TITLE);
  }

  translatedCount--;
  store.getState().setTranslatedElements(Math.max(0, translatedCount));
}

export function restoreAll(): void {
  restoreInRoot(document);
  // Also restore inside shadow roots
  for (const el of document.querySelectorAll("*")) {
    if (el.shadowRoot) restoreInRoot(el.shadowRoot);
  }
  translatedCount = 0;
  store.getState().setTranslatedElements(0);
}

function restoreInRoot(root: Document | ShadowRoot): void {
  for (const el of root.querySelectorAll(`[${ATTR.ACTIVE}]`)) {
    restoreElement(el);
  }
  for (const attr of TRANSLATABLE_ATTRS) {
    for (const el of root.querySelectorAll(`[${ATTR.attrPrefix(attr)}]`)) {
      restoreAttrs(el);
    }
  }
}

export function replaceAttr(
  element: Element,
  attr: string,
  original: string,
  translated: string
): void {
  element.setAttribute(ATTR.attrPrefix(attr), original);
  element.setAttribute(attr, translated);

  // Input elements render the .value property, not the attribute.
  // Defer to run after Vue's reactive cycle overwrites the property.
  if (attr === "value" && element instanceof HTMLInputElement) {
    element.value = translated;
    requestAnimationFrame(() => {
      if (element.isConnected) element.value = translated;
    });
  }
}

export function restoreAttrs(element: Element): void {
  for (const attr of TRANSLATABLE_ATTRS) {
    const original = element.getAttribute(ATTR.attrPrefix(attr));
    if (original) {
      element.setAttribute(attr, original);
      if (attr === "value" && element instanceof HTMLInputElement) {
        element.value = original;
      }
      element.removeAttribute(ATTR.attrPrefix(attr));
    }
  }
}

const patchedInputs = new WeakSet<HTMLInputElement>();

/**
 * Patch a readonly input's .value setter so Vue property changes
 * are intercepted and auto-translated.
 */
export function patchInputValue(
  input: HTMLInputElement,
  translateFn: (text: string) => Promise<string>,
  getCachedFn: (text: string, tgt: LangCode) => string | null,
  getTargetLang: () => LangCode
): void {
  if (patchedInputs.has(input)) return;
  patchedInputs.add(input);

  const desc = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )!;

  Object.defineProperty(input, "value", {
    get() {
      return desc.get!.call(this);
    },
    set(v: string) {
      desc.set!.call(this, v);
      if (!/[\u4e00-\u9fff]/.test(v)) return;

      const targetLang = getTargetLang();
      const cached = getCachedFn(v, targetLang);
      if (cached) {
        input.setAttribute(ATTR.attrPrefix("value"), v);
        desc.set!.call(this, cached);
        return;
      }

      translateFn(v).then((translated) => {
        if (!input.isConnected) return;
        input.setAttribute(ATTR.attrPrefix("value"), v);
        desc.set!.call(this, translated);
      }).catch(() => {});
    },
    configurable: true
  });
}
