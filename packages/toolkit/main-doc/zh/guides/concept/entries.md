---
title: 入口
sidebar_position: 2
---

入口是 Modern.js 默认的文件约定，项目的每一个入口是一张独立的页面，对应一条服务端路由。

很多配置，如 HTML 模板、Meta 信息、是否开启 SSR、SSG、服务端路由规则都是以入口为维度划分的。

## 单入口与多入口

Modern.js 初始化的项目是单入口的，项目结构如下：

```
.
├── node_modules
├── src
│   ├── modern-app-env.d.ts
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
├── package.json
├── modern.config.ts
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

Modern.js 可以很方便的将单入口切换成多入口。可以在项目下执行 `pnpm run new`，通过生成器创建入口：

```bash
? 请选择你想要的操作： 创建工程元素
? 创建工程元素： 新建「应用入口」
? 请填写入口名称： new-entry
```

执行后，`src/` 目录将会变成如下结构：

```
.
├── modern-app-env.d.ts
├── myapp
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
└── new-entry
    └── routes
        ├── index.css
        ├── layout.tsx
        └── page.tsx
```

原本的代码被移动到了和 `package.json` 中 `name` 同名的目录下，并创建了新的目录。

执行 `pnpm run dev` 后，可以看到新增一条 `/new-entry` 的路由，并且被迁移的代码路由并未发生变化。

:::note
Modern.js 会将和 `package.json` 中 `name` 同名的目录作为主入口，默认路由为 `/`，其他入口默认路由为 `/{entryName}`。
:::

## 入口条件

默认情况下，Modern.js 启动项目前会对 `src/` 下的文件进行扫描，识别入口，并生成对应的服务端路由。

:::tip
可以通过 [source.entriesDir](/docs/configure/app/source/entries-dir) 更改入口目录为其他目录。
:::

并非 `src/` 下所有的一级目录都会成为项目入口, 入口所在目录必须满足以下四个条件之一：

1. 具有 `routes/` 目录
2. 具有 `App.[jt]sx?` 文件
3. 具有 `index.[jt]sx?` 文件
2. 具有 `pages/` 目录（兼容旧版本）

当 `src/` 目录满足入口特征时，Modern.js 会认为当前项目为单入口应用。

:::tip
单入口默认的入口名为 `main`。
:::

当项目不是单入口应用时，Modern.js 会进一步查看 `src/` 下的一级目录。

## 入口的区别

不同约定的入口具有不同的行为。

### routes 入口

如果入口为 `routes/` 约定，Modern.js 会在启动时扫描 `routes` 下的文件，基于文件约定，自动生成客户端路由（react-router）。

详细内容可以参考[路由](/docs/guides/basic-features/routes).

### App 入口

如果入口为 `App.[jt]sx?` 约定，开发者可以在这个文件中自由的设置客户端路由，或者不设置客户端路由。

详细内容可以参考[路由](/docs/guides/basic-features/routes).

### Index 入口

通常情况下，上面两种模式已经能满足需求，但当开发者需要自己接管 React 挂载逻辑，或完全接管 Webpack 入口时，可以使用 `index.[jt]sx?` 约定。

如果入口为 `index.[jt]sx?` 约定，Modern.js 会根据该文件是否存在默认的组件导出，来决定构建行为。

详细内容可以参考[自定义 App](/docs/guides/advanced-features/custom-app).

## 配置入口

在 Modern.js 中，除了使用文件约定生成入口外，还可以在 `modern.config.[jt]s` 中手动配置入口。

:::tip
详情可以查看 [source.entries](/docs/configure/app/source/entries).
:::
