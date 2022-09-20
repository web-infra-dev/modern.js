---
title: config/public/
sidebar_position: 3
---

应用工程方案静态资源文件。

`public/` 目录中可以放置任意格式的静态资源文件，文件会被 Serve 在 Web 应用域名下。

## 说明

被 Serve 的文件路由基于目录结构的约定，其中，`public/` 为根目录，对应 Web 应用根域名。

例如 `config/public/sdk/index.js` 文件，在部署后将会被 Serve 在 `${domain}/sdk/index.js` 下。

## 场景

例如 `robots.txt`，`auth.xml` 等第三方系统需要的认证文件。

或者是给其他业务方（要求路由不变）的 SDK，也可以是无需入口的 HTML 文件等。

:::info
对于需要在源码中通过 import 引用的静态资源（比如 SVG 图片），建议放到 `src/assets` 目录下进行管理。
:::

## 代码压缩

如果目录下的文件是一个 `.js` 文件，在生产环境构建时，会自动对其进行代码压缩。

如果该文件以 `.min.js` 结尾，则不会经过代码压缩处理。
