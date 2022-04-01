---
title: server/index.[tj]s
sidebar_position: 1
---

扩展 Modern.js Server 的文件，在此文件中可以给 MWA 应用启动的 Web Server 添加前置中间件。

目前 MWA 应用支持四种不同的框架中间件：Express、Koa、Egg、Nest，具体使用示例可查看 [hook](/docs/apis/runtime/web-server/hook)。

可以对请求和响应进行拦截处理，鉴权与角色、请求预处理、异常兜底等；也可在 Server 的运行流程中（包括路由匹配、资源寻址、头部注入、页面渲染，静态 Web 托管）插入特定的业务逻辑。

:::info 注
使用自定义 Server 需要在项目下执行 new 命令新建「Server 自定义」源码目录。
:::
