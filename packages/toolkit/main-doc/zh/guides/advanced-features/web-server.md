---
title: 自定义 Web Server
sidebar_position: 2
---

Modern.js 作为以客户端为中心的开发框架，对服务端的定制能力较弱。而在有些开发场景下，需要定制特殊的服务端逻辑，例如用户鉴权、请求预处理、添加页面渲染骨架等。

因此 Modern.js 提供了一种功能，让项目可以在给定的范围内扩展 Modern.js 内置的 Web Server，来实现相应的需求。

## 创建自定义 Web Server

在项目根目录执行 `pnpm run new` 命令，按照如下选择，开启「自定义 Web Serve」功能：

```bash
? 请选择你想要的操作 创建工程元素
? 创建工程元素 新建「自定义 Web Server」源码目录
```

执行命令后，项目目录下会新建 `server/index.ts` 文件，自定义逻辑在这个文件中编写。

## 使用 API 扩展 Web Server

Modern.js 提供了 **Hook** 与 **Middleware** 两类 API 来扩展 Web Server。

### Hook

Hook 可以控制 Web Server 对请求处理的内置逻辑，非 BFF 请求会经过 Hook 的处理。

Hook 不可以使用运行时框架拓展。

详细 API 可以查看 [Hook](/docs/apis/app/runtime/web-server/hook)。


### Middleware

Middleware 可以为 Web Server 添加前置中间件，只有 SSR 请求会经过 Middleware 的处理。

Middleware 可以使用运行时框架拓展。

详细 API 可以查看 [Hook](/docs/apis/app/runtime/web-server/middleware)。

## 完全自定义的 Web Server

:::note
敬请期待
:::
