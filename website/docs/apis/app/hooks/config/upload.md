---
title: config/upload/
sidebar_position: 4
---

应用工程方案静态资源文件。

`upload/` 目录中可以放置任意格式的静态资源文件。

## 说明

在开发环境下，该目录下的静态资源文件会被托管在 `/upload` 路径下。构建应用产物后，该目录下的文件会被复制到产物目录中。

该文件约定主要用于开发者使用插件，主动上传静态资源文件到 CDN。

:::info 注
目前 Modern.js 中提供的 CDN 上传插件（[OSS](/docs/guides/features/server-side/deploy/upload-cdn/oss)、[COS](/docs/guides/features/server-side/deploy/upload-cdn/cos)）都已经支持将该目录同步上传到云平台中。
:::

## 场景

例如 `google-analysis.js` 等项目自用的 SDK（通常需要 http 缓存）。

图片、字体文件、通用 CSS 等。

如果并非必要，Modern.js 推荐将 JS / CSS 这类文件通过 `upload/` 上传到 CDN，而不使用 `public/`。

## 代码压缩

如果目录下的文件是一个 `.js` 文件，在生产环境构建时，会自动对其进行代码压缩。

如果该文件以 `.min.js` 结尾，则不会经过代码压缩处理。

## 更多用法

不论是在[自定义 HTML](/docs/guides/usages/html) 中，或是在 [`config/public/`](/docs/apis/hooks/mwa/config/public) 下的任意 HTML 文件中，都可以直接使用 HTML 标签引用 `config/upload/` 目录下的资源：

```html
<script src="/upload/index.js"></script>
```

如果设置了 [`output.assetPrefix`](/docs/apis/config/output/asset-prefix) 前缀，也可以直接使用模板语法添加该前缀：

```html
<script src="<%=assetPrefix %>/upload/index.js"></script>
```

:::info 注
Modern.js 没有支持在 `config/public/*.css`（例如 background-image）中通过 URL 使用 `config/upload/` 下的文件。

因为 Modern.js 不推荐在 `public/` 中放 JS、CSS 这类资源文件，可以将它们直接放置在 `upload/` 目录下。
:::
