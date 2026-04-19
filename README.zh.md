# LiteLoaderQQNT-i18n

[English](./README.md) | 简体中文

> 友情链接：[LINUX DO](https://linux.do/) — 新的理想型社区

[LiteLoaderQQNT](https://github.com/LiteLoaderQQNT/LiteLoaderQQNT) 插件，将 QQ 的整个中文界面翻译为任意语言。无需 API 密钥。

![截图](./res/screenshots/1.png)

> ⚠️ **账号封禁风险。** 腾讯正在主动检测修改版 QQNT 客户端。自 2024 年底起，使用 LiteLoaderQQNT、NapCat 等加载器的用户陆续报告账号限制、强制手机/人脸验证，甚至永久封禁。PC 端封禁通常延迟数天触发，当时看起来正常的会话之后仍可能被处罚。请使用小号或测试账号，切勿在主号上使用。如果你只是想要一个无广告的 QQ，建议改用腾讯官方轻量客户端 [TIM](https://im.qq.com/)。相关用户反馈见[此帖](https://linux.do/t/topic/485908)。

## 功能特性

- 翻译按钮、菜单、设置、下拉选项、聊天预览和消息
- 在任意输入框右键或按 `Ctrl+Shift+T` 翻译输入内容（支持原文/译文切换）
- 聊天工具栏一键翻译按钮
- 三级缓存（内存、静态词典、IndexedDB），重复文本瞬间翻译
- 鼠标悬停已翻译元素可查看原始中文
- 可分别控制 UI 标签、聊天预览、聊天消息的翻译
- 支持任意 [DeepLX](https://github.com/OwO-Network/DeepLX) 兼容接口

## 安装方法

本插件基于 [LiteLoaderQQNT](https://github.com/LiteLoaderQQNT/LiteLoaderQQNT)（QQNT 的插件加载器，类似于 Discord 的 Vencord）。请先安装 LiteLoaderQQNT，然后通过以下方式安装本插件：

- **插件列表查看**: 搜索 "QQ i18n" 点击安装，重启 QQ。
- **PluginInstaller**: 粘贴 `https://raw.githubusercontent.com/0-don/LiteLoaderQQNT-i18n/main/manifest.json`，重启 QQ。
- **手动安装**: 下载 ZIP，打开 LiteLoader 设置页面，点击「选择文件」导入 ZIP，重启 QQ。

## 开发

需要 [Bun](https://bun.sh)。

```bash
bun install
bun run dev        # 构建 + 监听文件变更
```

安装 [Chii DevTools](https://github.com/mo-jinran/chii-devtools) 后，每次构建会自动热重载所有已打开的 QQ 窗口。

## 许可证

[MIT](./LICENSE)
