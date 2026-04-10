import { ipcMain, net } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { DEFAULT_CONFIG, IPC, SLUG } from "../shared/constants";
import type { PluginConfig, TranslationResponse } from "../shared/types";

const dataPath = LiteLoader.plugins[SLUG].path.data;
const configPath = join(dataPath, "config.json");

function log(...args: unknown[]) {
  console.log("[qq-i18n]", ...args);
}

function readConfig(): PluginConfig {
  if (!existsSync(dataPath)) mkdirSync(dataPath, { recursive: true });
  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return { ...DEFAULT_CONFIG };
  }
  const raw = readFileSync(configPath, "utf-8");
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
}

function writeConfig(config: PluginConfig) {
  if (!existsSync(dataPath)) mkdirSync(dataPath, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function translateViaNet(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResponse> {
  const config = readConfig();
  const url = `${config.apiUrl}/translate`;

  return new Promise((resolve, reject) => {
    const request = net.request({ method: "POST", url });
    request.setHeader("Content-Type", "application/json");

    request.on("response", (response: Electron.IncomingMessage) => {
      let body = "";
      response.on("data", (chunk: Buffer) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error(`Invalid JSON: ${body.substring(0, 100)}`));
        }
      });
    });

    request.on("error", reject);
    request.write(
      JSON.stringify({
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
      })
    );
    request.end();
  });
}

ipcMain.handle(IPC.GET_CONFIG, () => readConfig());

ipcMain.handle(IPC.SET_CONFIG, (_event, config: PluginConfig) => {
  writeConfig(config);
});

ipcMain.handle(
  IPC.TRANSLATE,
  async (_event, text: string, sourceLang: string, targetLang: string) => {
    try {
      return await translateViaNet(text, sourceLang, targetLang);
    } catch (error) {
      log("Translation error:", error);
      return { code: -1, data: "" };
    }
  }
);

ipcMain.handle(IPC.LOG, (_event, ...args: unknown[]) => {
  log(...args);
});

log("Main process initialized");

module.exports.onBrowserWindowCreated = () => {};
