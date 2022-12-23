---
title: 快速上手
sidebar_position: 1
---

## 环境准备

import Prerequisites from '@site-docs/components/prerequisites.md'

<Prerequisites />

## 安装

Modern.js 提供了 `@modern-js/create` 生成器来创建项目，不要全局安装，使用 `npx` 按需运行。

可以使用已有的空目录来创建项目：

```bash
mkdir myapp && cd myapp
npx @modern-js/create
```

也可以直接用新目录创建项目：

```bash
npx @modern-js/create myapp
```

## 初始化项目


import InitApp from '@site-docs/components/init-app.md'

<InitApp />

## 启动项目

import DebugApp from '@site-docs/components/debug-app.md'

<DebugApp />

## 使用配置

通过生成器创建的 Modern.js 项目中，存在 `modern.config.ts` 文件。

可以通过配置文件来开启功能，或覆盖 Modern.js 的默认行为。例如添加如下配置，开启 SSR：

```ts
import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  server: {
    ssr: true,
  },
  plugins: [AppToolsPlugin()],
});
```

重新执行 `pnpm run dev`，在浏览器 Network 菜单中，可以发现项目已经在服务端完成了页面渲染。

## 构建项目

在项目中执行 `pnpm run build` 即可构建项目生产环境产物：

```bash
$ pnpm run build

> modern build

info    Create a production build...

info    File sizes after production build:

  File                                      Size         Gzipped
  dist/static/js/lib-corejs.ffeb7fb8.js     214.96 kB    67.23 kB
  dist/static/js/lib-react.09721b5c.js      152.61 kB    49.02 kB
  dist/static/js/218.102e2f39.js            85.45 kB     28.5 kB
  dist/static/js/lib-babel.a7bba875.js      11.93 kB     3.95 kB
  dist/html/main/index.html                 5.84 kB      2.57 kB
  dist/static/js/main.3568a38e.js           3.57 kB      1.44 kB
  dist/static/css/async/304.c3c481a5.css    2.62 kB      874 B
  dist/asset-manifest.json                  1.48 kB      349 B
  dist/static/js/async/304.c45706bc.js      1.4 kB       575 B
  dist/static/js/async/509.fcb06e14.js      283 B        230 B

 Client ✔ done in 3.57s
 ```

构建产物默认生成到 `dist/`，目录结构如下：

```
.
├── asset-manifest.json
├── html
│   └── main
├── loader-routes
│   └── main
├── modern.config.json
├── route.json
└── static
    ├── css
    └── js
```

## 本地验证

在项目中执行 `pnpm run serve` 即可在本地验证构建产物是否正常运行：

```bash
$ pnpm run serve

> modern serve

Starting the modern server...
info    App running at:

  > Local:    http://localhost:8080/
  > Network:  http://192.168.0.1:8080/
```

在浏览器中打开 `http://localhost:8000/`，内容应该和 `pnpm run dev` 时一致。

## 部署

import Deploy from '@site-docs/components/deploy.md'

<Deploy />
