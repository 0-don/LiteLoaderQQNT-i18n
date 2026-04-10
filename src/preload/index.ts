import { contextBridge, ipcRenderer } from "electron";
import { IPC, SLUG_UNDERSCORE } from "../shared/constants";
import type { QqI18nApi } from "../shared/types";

const api: QqI18nApi = {
  getConfig: () => ipcRenderer.invoke(IPC.GET_CONFIG),
  setConfig: (config) => ipcRenderer.invoke(IPC.SET_CONFIG, config),
  translate: (text, sourceLang, targetLang) =>
    ipcRenderer.invoke(IPC.TRANSLATE, text, sourceLang, targetLang),
  log: (...args) => ipcRenderer.invoke(IPC.LOG, ...args)
};

contextBridge.exposeInMainWorld(SLUG_UNDERSCORE, api);
