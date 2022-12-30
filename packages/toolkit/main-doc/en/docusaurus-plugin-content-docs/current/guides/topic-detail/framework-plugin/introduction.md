---
title: 介绍
sidebar_position: 1
---

## Modern.js 插件系统

Modern.js 用于扩展项目运行、请求、渲染等不同阶段功能的系统，主要分为三个部分：Hook 模型、管理器，上下文共享机制。

Hook 模型用于确定当前 Hook 的执行方式，不同 Hook 模型的函数拥有不同的执行逻辑。管理器用于控制 Hook 的执行与调度。上下文共享机制用于在不同 Hook 间传递信息。

目前 Modern.js 提供几种不同的 Hook 模型：

- Pipeline
  - Sync
  - Async
- Waterfall
  - Sync
  - Async
- Workflow
  - Sync
  - Async
  - Parallel(Async)

:::note
后续章节详细介绍各个模型的执行方式。
:::

基于 Hook 模型和管理器，Modern.js 暴露了三套插件：CLI、Runtime、Server。

其中 CLI 插件是 Modern.js 中主要的运行流程控制模型，Modern.js 中绝大部分功能都是主要通过这一套模型运行的。Runtime 插件主要负责处理 React 组件渲染逻辑。Server 插件主要用于对服务端的生命周期以及用户请求的控制。

## 插件可以做什么

Modern.js 的所有功能都是通过这套插件实现的，这意味着 Modern.js 中的所有能力是都对开发者开放的。开发者可以通过编写插件来扩展更多功能，适配复杂场景，包括但不限于：

- 注册命令
- 修改 Modern.js 配置、配置校验 Schema
- 修改编译时的 Webpack/Babel/Less/Sass/Tailwind CSS/... 配置
- 修改运行时需要渲染的 React 组件、Element
- 修改页面路由
- 修改服务器路由
- 自定义控制台输出
- 自定义动态 HTML 模版
- 自定义 Node.js 服务器框架
- 自定义 React 组件客户端/服务器端渲染
- ...

当 Modern.js 暂时没有覆盖到你所需要的功能或场景时，可以开发一个自定义插件，来实现适配特殊场景的相关功能。
