import "preact";

// Augment Preact's JSX IntrinsicElements with LiteLoader custom elements
declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      "setting-section": HTMLAttributes<HTMLElement> & {
        "data-title"?: string;
      };
      "setting-panel": HTMLAttributes<HTMLElement>;
      "setting-list": HTMLAttributes<HTMLElement> & {
        "data-direction"?: "column" | "row";
        "is-collapsible"?: string;
      };
      "setting-item": HTMLAttributes<HTMLElement> & {
        "data-direction"?: "column" | "row";
      };
      "setting-text": HTMLAttributes<HTMLElement> & {
        "data-type"?: "primary" | "secondary";
      };
      "setting-switch": HTMLAttributes<HTMLElement> & { "is-active"?: string };
      "setting-select": HTMLAttributes<HTMLElement>;
      "setting-option": HTMLAttributes<HTMLElement> & {
        "data-value"?: string;
        "is-selected"?: string;
      };
      "setting-button": HTMLAttributes<HTMLElement> & {
        "data-type"?: "primary" | "secondary";
      };
      "setting-divider": HTMLAttributes<HTMLElement> & {
        "data-direction"?: "column" | "row";
      };
      "setting-link": HTMLAttributes<HTMLElement> & { "data-value"?: string };
      "setting-modal": HTMLAttributes<HTMLElement> & {
        "data-title"?: string;
        "is-active"?: string;
      };
    }
  }
}
