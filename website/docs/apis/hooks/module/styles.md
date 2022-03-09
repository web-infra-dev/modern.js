---
title: styles/
sidebar_position: 3
---

模块工程方案独立样式资源目录。

在使用模块工程方案进行组件开发时，Modern.js 支持开发独立样式。

独立样式的代码放置在项目的 styles 目录，支持任意 .css、.scss、.less 文件。

独立样式使用到的静态资源也需要放置到 styles 目录统一管理，模块工程方案编译时，会将 styles 目录的非样式文件进行复制到 dist/styles 目录。
