# LiteLoaderQQNT-i18n

[English](./README.md) | 简体中文

[LiteLoaderQQNT](https://github.com/LiteLoaderQQNT/LiteLoaderQQNT) 插件，将 QQ 的整个中文界面翻译为任意语言。

> [!NOTE]
> 默认使用免费的 DeepLX 兼容接口，无需 API 密钥。

## 功能特性

- **全界面翻译** 按钮、菜单、导航栏、设置页面、插件列表，全部自动翻译
- **聊天翻译** 可分别开关侧边栏消息预览和完整聊天消息的翻译
- **三级缓存** 内存缓存 → 内置静态词典 → IndexedDB 持久化，重复文本瞬间翻译
- **Shadow DOM 支持** LiteLoader 插件界面同样翻译
- **Vue 覆写检测** Vue 重渲染覆盖翻译后自动重新翻译
- **聊天翻译按钮** 在聊天工具栏一键将你输入的内容翻译为中文
- **右键翻译** 在任意可编辑输入框右键即可翻译内容，支持在原文和译文之间切换
- **快捷键翻译** 按 `Ctrl+Shift+T` 翻译当前聚焦的输入框（适用于所有输入框，包括没有右键菜单的）
- **下拉菜单翻译** 下拉选择器选项也会被翻译，包括单字选项
- **自定义 API** 支持配置任意 DeepLX 兼容翻译接口
- **统计面板** 实时查看缓存命中率、API 调用次数、队列长度、错误数
- **悬停查看原文** 鼠标悬停在已翻译元素上即可看到原始中文

## 截图

![截图](./res/screenshots/1.png)

## 安装方法

### 插件列表查看

安装 [插件列表查看](https://github.com/ltxhhz/LL-plugin-list-viewer) 插件，打开对应设置页面，找到 QQ i18n，点击 **安装**，安装完成后重启 QQ。

### PluginInstaller

安装 [PluginInstaller](https://github.com/xinyihl/LiteLoaderQQNT-PluginInstaller) 插件，打开对应设置页面，在安装插件输入框内输入：

```
https://raw.githubusercontent.com/0-don/LiteLoaderQQNT-i18n/main/manifest.json
```

点击确定按钮，安装完成后重启 QQ。

### 手动安装

将下载的 ZIP 文件解压，解压出的文件夹移动至 `LiteLoaderQQNT目录/plugins/` 内，重启 QQ 即可。

## 从源码构建

需要 [Bun](https://bun.sh) 运行时。

```bash
bun install
bun run build
```

构建产物在 `dist/` 目录下。将整个插件文件夹复制到 `LiteLoaderQQNT/plugins/` 即可。

## 配置说明

打开 QQ 设置页面，找到 QQ i18n 设置面板，包含三个部分：

**翻译设置**

- 启用/关闭翻译
- 选择目标语言
- 分别控制 UI 标签、聊天预览、聊天消息的翻译

**API 配置**

- 默认使用免费的 [DeepLX](https://github.com/OwO-Network/DeepLX) 接口，开箱即用
- 可自定义任意 DeepLX 兼容翻译接口地址

**统计数据**

- 查看已缓存翻译数、已翻译元素数、API 调用次数、缓存命中率、队列长度、错误数
- 清除翻译缓存

## 技术栈

Preact · Zustand · TypeScript · Bun · Tailwind CSS · idb-keyval

## 许可证

[MIT](./LICENSE)
