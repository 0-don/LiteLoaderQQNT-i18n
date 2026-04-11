# LiteLoaderQQNT-i18n

English | [简体中文](./README.zh.md)

A [LiteLoaderQQNT](https://github.com/LiteLoaderQQNT/LiteLoaderQQNT) plugin that translates QQ's entire Chinese UI into any language.

> [!NOTE]
> Uses a free DeepLX-compatible API by default. No API key required.

## Features

- **Full UI Translation** Buttons, menus, navigation bars, settings pages, plugin lists, all translated automatically
- **Chat Translation** Toggle sidebar message previews and full chat messages independently
- **3-Tier Caching** Memory cache → bundled static dictionary → IndexedDB persistence, repeated text translates instantly
- **Shadow DOM Support** LiteLoader plugin UIs get translated too
- **Vue Reversion Detection** Automatically re-translates when Vue re-renders and overwrites translations
- **Chat Translate Button** One-click toolbar button to translate your input into Chinese
- **Right-Click Translate** Right-click any editable input to translate its content, toggle between original and translated text
- **Keyboard Shortcut** Press `Ctrl+Shift+T` to translate the currently focused input (works everywhere, even inputs without a right-click menu)
- **Dropdown Translation** Dropdown menu options (pulldown selectors) are translated, including single-character items
- **Custom API** Configure any DeepLX-compatible translation endpoint
- **Statistics Dashboard** Monitor cache hit rate, API calls, queue length, and errors in real time
- **Hover for Original** Hover over any translated element to see the original Chinese text

## Screenshots

![Screenshot](./res/screenshots/1.png)

## Installation

### Plugin List Viewer

Install the [Plugin List Viewer](https://github.com/ltxhhz/LL-plugin-list-viewer) plugin. Open its settings page, find QQ i18n, and click **Install**. Restart QQ after installation.

### PluginInstaller

Install the [PluginInstaller](https://github.com/xinyihl/LiteLoaderQQNT-PluginInstaller) plugin. Open its settings page and paste the following URL into the plugin installation input:

```
https://raw.githubusercontent.com/0-don/LiteLoaderQQNT-i18n/main/manifest.json
```

Click OK, then restart QQ.

### Manual Installation

Download and extract the ZIP file. Move the extracted folder to `LiteLoaderQQNT directory/plugins/` and restart QQ.

## Build from Source

Requires [Bun](https://bun.sh) runtime.

```bash
bun install
bun run build
```

Build output is in `dist/`. Copy the entire plugin folder to `LiteLoaderQQNT/plugins/`.

## Configuration

Open QQ Settings and find the QQ i18n settings panel. It has three sections:

**Translation Settings**

- Enable/disable translation
- Select target language
- Toggle UI labels, chat previews, and chat messages independently

**API Configuration**

- Works out of the box with the free [DeepLX](https://github.com/OwO-Network/DeepLX) endpoint
- Optionally set a custom DeepLX-compatible translation endpoint

**Statistics**

- View cached translations, translated elements, API calls, cache hit rate, queue length, and errors
- Clear translation cache

## Tech Stack

Preact · Zustand · TypeScript · Bun · Tailwind CSS · idb-keyval

## License

[MIT](./LICENSE)
