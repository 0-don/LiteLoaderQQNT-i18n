import type { BunPlugin } from "bun";
import { execSync } from "child_process";
import { mkdirSync, readFileSync, watch, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import postcss from "postcss";
import postcssrc from "postcss-load-config";

const watchMode = Bun.argv.includes("--watch");
const STYLE_ID = "qq-i18n-styles";
const DIST = resolve("dist/src");

mkdirSync(DIST, { recursive: true });

const postcssPlugin: BunPlugin = {
  name: "postcss",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async ({ path: p }) => {
      const { plugins } = await postcssrc({}, dirname(p));
      const result = await postcss(plugins).process(readFileSync(p, "utf-8"), {
        from: p,
      });
      return { contents: result.css, loader: "css" };
    });
  },
};

async function typecheck(): Promise<boolean> {
  try {
    execSync("tsc --noEmit", { stdio: "pipe" });
    return true;
  } catch (error: any) {
    console.error(
      "Typecheck failed:\n" +
        (error.stdout?.toString() || error.stderr?.toString())
    );
    return false;
  }
}

async function runBuild() {
  const start = performance.now();

  if (!watchMode) {
    const ok = await typecheck();
    if (!ok) return false;
  }

  // Build main and preload (CJS, no CSS)
  const [main, preload] = await Promise.all([
    Bun.build({
      entrypoints: [resolve("src/main/index.ts")],
      outdir: DIST,
      naming: "main.js",
      target: "node",
      format: "cjs",
      external: ["electron"],
      minify: !watchMode,
    }),
    Bun.build({
      entrypoints: [resolve("src/preload/index.ts")],
      outdir: DIST,
      naming: "preload.js",
      target: "node",
      format: "cjs",
      external: ["electron"],
      minify: !watchMode,
    }),
  ]);

  // Build renderer separately (ESM + CSS)
  const rendererDir = resolve("dist/.renderer-tmp");
  mkdirSync(rendererDir, { recursive: true });

  const renderer = await Bun.build({
    entrypoints: [resolve("src/renderer/index.ts")],
    outdir: rendererDir,
    target: "browser",
    format: "esm",
    minify: !watchMode,
    plugins: [postcssPlugin],
  });

  const failures = [...main.logs, ...preload.logs, ...renderer.logs].filter(
    (l) => l.level === "error"
  );

  if (failures.length) {
    for (const log of failures) console.error(log);
    return false;
  }

  // Combine renderer JS + CSS into single file
  const jsOutput = renderer.outputs.find((o) => o.path.endsWith(".js"));
  const cssOutput = renderer.outputs.find((o) => o.path.endsWith(".css"));

  let js = jsOutput ? await jsOutput.text() : "";

  if (cssOutput) {
    const css = await cssOutput.text();
    js += `\n;(()=>{if(!document.getElementById("${STYLE_ID}")){const s=document.createElement("style");s.id="${STYLE_ID}";s.textContent=String.raw\`${css}\`.trim();document.head.appendChild(s)}})()`;
  }

  writeFileSync(resolve(DIST, "renderer.js"), js);

  const ms = (performance.now() - start).toFixed(0);
  console.log(`Built main + preload + renderer in ${ms}ms`);
  return true;
}

await runBuild();

if (watchMode) {
  console.log("Watching src/ for changes...");
  let timer: Timer | null = null;
  watch("src", { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      console.log(`\n${filename} changed`);
      await runBuild();
    }, 200);
  });
}
