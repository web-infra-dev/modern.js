---
title: src/404/App.[tj]s,src/500/App.[tj]s,src/_error/App.[tj]s
sidebar_position: 4
---

应用项目错误页面。

Modern.js 约定将 `src/404/App.[tj]s` 为默认的 404 路由入口，`src/500/App.[tj]s`为默认 500 路由入口，`src/_error/App.[tj]s` 为默认错误路由入口。

在服务端渲染的场景下，如果服务端出错，会根据 Error Code 返回对应路由的错误入口页面。
