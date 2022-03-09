---
title: api/_app.[tj]s
sidebar_position: 3
---

在 Modern.js 函数写法下，该文件可以给 MWA 应用服务端添加前置中间件；该中间件的执行会在[ BFF 函数](/docs/apis/hooks/mwa/api/functions/api)之前执行。

目前 Modern.js 支持四种不同的框架，express，koa，nest，egg 等，不同的框架需要添加相应框架的中间件。具体示例请参考 [hook](/docs/apis/runtime/bff-server/hook)


