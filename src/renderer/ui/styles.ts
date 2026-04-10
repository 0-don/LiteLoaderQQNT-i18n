// CSS is imported here so Bun's PostCSS plugin processes it.
// The build script injects the compiled CSS into renderer.js at build time.
import "./global.css";

export function injectStyles(): void {
  // CSS is auto-injected by the build script's style injection.
  // This function exists as a no-op entry point for the bootstrap sequence.
}
