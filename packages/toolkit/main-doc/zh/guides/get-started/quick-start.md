---
title: 快速上手
sidebar_position: 1
---

## 环境准备

### Node.js

需要 [Node.js LTS](https://github.com/nodejs/Release)，并确保 Node 版本大于等于 14.19.0, 推荐使用 16.x 版本。

Modern.js 推荐在开发环境里先安装 [nvm](https://github.com/nvm-sh/nvm#install--update-script)，在 shell 里集成[自动切换 node 版本的脚本](https://github.com/nvm-sh/nvm#deeper-shell-integration)。

然后只要仓库根目录下有内容为 `lts/fermium` 或 `lts/gallium` 的 `.nvmrc` 文件，进入这个仓库时就会自动安装或切换到正确的 Node.js 版本。

### pnpm

推荐使用 [pnpm](https://pnpm.io/installation) 来管理依赖：

```bash
npm install -g pnpm
```

:::note
Modern.js 同样支持使用 `yarn`、`npm` 进行依赖管理。
:::

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

Modern.js 生成器会提供一个可交互的问答界面，根据结果初始化项目，按照默认的选择进行初始化：

```bash
? 请选择你想创建的工程类型 应用
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
```

在生成项目后，Modern.js 会自动安装依赖、创建 git 仓库。

```bash
[INFO] 依赖自动安装成功
[INFO] git 仓库初始化成功
[INFO] 创建成功！
可在新项目的目录下运行以下命令：
pnpm run dev          # 按开发环境的要求，运行和调试项目
pnpm run build        # 按产品环境的要求，构建项目
pnpm run start        # 按产品环境的要求，运行项目
pnpm run lint         # 检查和修复所有代码
pnpm run new          # 继续创建更多项目要素，比如应用入口
```

:::note
Modern.js 生成器除了在项目初始化时工作外，也能在后续研发中生成项目各种粒度的模块，并非一用即抛开。
:::

现在，项目结构如下：

```
.
├── node_modules
├── src
│   ├── modern-app-env.d.ts
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
├── modern.config.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

## 启动项目

在项目中执行 `pnpm run dev` 即可启动项目：

```bash
$ pnpm run dev

> modern dev

info    Starting dev server...
info    App running at:

  > Local:    http://localhost:8080/
  > Network:  http://10.94.58.87:8080/
  > Network:  http://10.254.68.105:8080/

 Client ✔ done in 76.10ms
```

在浏览器中打开 `http://localhost:8000/`，能看到以下内容：

![dev](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/dev.png)

## 使用配置

通过生成器创建的 Modern.js 项目中，存在 `modern.config.ts` 文件。

可以通过配置文件来开启功能，或覆盖 Modern.js 的默认行为。例如添加如下配置，开启 SSR：

```ts
import { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  server: {
    ssr: true,
  },
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

在项目中执行 `pnpm run start` 即可在本地验证构建产物是否正常运行：

```bash
$ pnpm run start

> modern start

Starting the modern server...
info    App running at:

  > Local:    http://localhost:8080/
  > Network:  http://10.94.58.87:8080/
  > Network:  http://10.254.68.105:8080/
```

在浏览器中打开 `http://localhost:8000/`，内容应该和 `pnpm run dev` 时一致。

## 部署

本地验证完成后，可以将 `dist/` 下的产物整理成服务器需要的结构，进行部署。
