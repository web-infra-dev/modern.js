---
title: styles/
sidebar_position: 3
---

模块工程方案独立样式资源目录。

在使用模块工程方案进行组件开发时，Modern.js 支持开发独立样式。

独立样式的代码放置在项目的 styles 目录，支持任意 .css、.scss、.less 文件。

独立样式使用到的静态资源也需要放置到 styles 目录统一管理，模块工程方案编译时，会将 styles 目录的非样式文件进行复制到 dist/styles 目录。

:::caution 注意
在下一个版本，该特性可能会被移除。

在当前版本，该特性在默认情况下仍然支持。当在 `modern.config` 中出现以下配置时候，该特性将会失效：

- [`output.buildPreset`](/docs/apis/config/output/build-preset)
- [`output.buildConfig`](/docs/apis/config/output/build-config)
:::
