import { SLUG } from "@shared/constants";
import type { BunPlugin } from "bun";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  watch,
  writeFileSync
} from "fs";
import { homedir } from "os";
import { dirname, resolve } from "path";
import postcss from "postcss";
import postcssrc from "postcss-load-config";

const watchMode = Bun.argv.includes("--watch");
const DIST = resolve("dist/src");
const CHII_PORT = 12580;

const PLUGIN_DIR = (() => {
  const home = homedir();
  const profile = process.env.LITELOADERQQNT_PROFILE;
  if (profile) return resolve(profile, `plugins/${SLUG}`);
  if (process.platform === "win32")
    return resolve(home, `AppData/Roaming/LiteLoaderQQNT/plugins/${SLUG}`);
  if (process.platform === "darwin")
    return resolve(
      home,
      `Library/Application Support/LiteLoaderQQNT/plugins/${SLUG}`
    );
  return resolve(home, `.config/LiteLoaderQQNT/plugins/${SLUG}`);
})();

mkdirSync(DIST, { recursive: true });

const postcssPlugin: BunPlugin = {
  name: "postcss",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async ({ path: p }) => {
      const { plugins } = await postcssrc({}, dirname(p));
      const result = await postcss(plugins).process(readFileSync(p, "utf-8"), {
        from: p
      });
      return { contents: result.css, loader: "css" };
    });
  }
};

function buildCJS(entry: string, name: string) {
  return Bun.build({
    entrypoints: [resolve(`src/${entry}/index.ts`)],
    outdir: DIST,
    naming: `${name}.js`,
    target: "node",
    format: "cjs",
    external: ["electron"],
    minify: !watchMode
  });
}

async function runBuild() {
  const start = performance.now();

  const [main, preload] = await Promise.all([
    buildCJS("main", "main"),
    buildCJS("preload", "preload")
  ]);

  const tmpDir = resolve("dist/.renderer-tmp");
  mkdirSync(tmpDir, { recursive: true });

  const renderer = await Bun.build({
    entrypoints: [resolve("src/renderer/index.ts")],
    outdir: tmpDir,
    target: "browser",
    format: "esm",
    minify: !watchMode,
    plugins: [postcssPlugin],
    loader: { ".svg": "text" }
  });

  const errors = [...main.logs, ...preload.logs, ...renderer.logs].filter(
    (l) => l.level === "error"
  );
  if (errors.length) {
    for (const e of errors) console.error(e);
    return false;
  }

  // Combine renderer JS + CSS into a single file (CSS injected at runtime)
  let js =
    (await renderer.outputs.find((o) => o.path.endsWith(".js"))?.text()) ?? "";
  const css = await renderer.outputs
    .find((o) => o.path.endsWith(".css"))
    ?.text();
  if (css) {
    js += `\n;(()=>{if(!document.getElementById("liteloaderqqnt-i18n-styles")){const s=document.createElement("style");s.id="liteloaderqqnt-i18n-styles";s.textContent=String.raw\`${css}\`.trim();document.head.appendChild(s)}})()`;
  }

  writeFileSync(resolve(DIST, "renderer.js"), js);
  rmSync(tmpDir, { recursive: true, force: true });

  console.log(
    `Built main + preload + renderer in ${(performance.now() - start).toFixed(0)}ms`
  );

  // Deploy to plugin directory
  mkdirSync(resolve(PLUGIN_DIR, "dist"), { recursive: true });
  cpSync(resolve("dist/src"), resolve(PLUGIN_DIR, "dist/src"), {
    recursive: true
  });
  cpSync(resolve("manifest.json"), resolve(PLUGIN_DIR, "manifest.json"));
  cpSync(resolve("res"), resolve(PLUGIN_DIR, "res"), { recursive: true });
  console.log(`Deployed to ${PLUGIN_DIR}`);

  // Hot reload via Chii DevTools (optional, silent if Chii not running)
  try {
    const res = await fetch(`http://localhost:${CHII_PORT}/targets`);
    const { targets } = (await res.json()) as {
      targets: { id: string; url: string }[];
    };
    // Reload all QQ renderer windows (main, settings, etc.)
    const reloadTargets = targets.filter(
      (t) =>
        t.url.includes("index.html") &&
        !t.url.includes("chii_app") &&
        !t.url.includes("hiddenWindow") &&
        !t.url.includes("chatPoolWin")
    );
    if (reloadTargets.length > 0) {
      await Promise.all(
        reloadTargets.map(
          (t) =>
            new Promise<void>((resolve) => {
              const ws = new WebSocket(
                `ws://localhost:${CHII_PORT}/client/LiteLoader?target=${t.id}`
              );
              ws.onopen = () => {
                ws.send(
                  JSON.stringify({
                    id: 1,
                    method: "Runtime.evaluate",
                    params: { expression: "window.location.reload()" }
                  })
                );
                setTimeout(() => {
                  ws.close();
                  resolve();
                }, 200);
              };
              ws.onerror = () => resolve();
            })
        )
      );
      console.log(`Reloaded ${reloadTargets.length} QQ window(s)`);
    }
  } catch {}

  return true;
}

// --- Entry ---

await runBuild();

if (watchMode) {
  console.log("Watching src/ for changes...");
  let timer: Timer | null = null;
  watch("src", { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      console.log(`\n${filename} changed`);
      try {
        await runBuild();
      } catch (e: any) {
        console.error("Build failed:", e.message || e);
      }
    }, 200);
  });
}
