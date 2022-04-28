---
sidebar_position: 1
---

# 概览

Modern.js 的基础的插件系统中主要分为三个部分：Hook 模型（Pipeline、Workflow、Waterfall）、 Hook 模型的管理器（Manager），上下文共享机制。

其中的 Hook 模型是用于管理运行一系列相同模型（形状）函数的管理工具，目前提供了三个大类，7个小类：

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

它们之间的区别是他们所管理的函数的运行模式的不同。不同的地方会在下面具体分析介绍。

Hook 模型的管理器（Manager），顾名思义就是用来管理上面提到的那些 Hook 模型，添加至同一个 Manager 可以使用同一个 Runner 对象（包含所有 Hook 的执行函数）来运行，也共享同一个上下文环境。而 Modern.js 的基础插件系统中的插件就是针对 Manager 来说的，是一个拥有属性、插件 Hook 函数的对象。

基于上面的工具（Hook 模型 + Manager），在 Modern.js 中主要构建了三套插件模型：CLI、Runtime、Server。其中 CLI 是 Modern.js 中主要的运行流程控制模型，Modern.js 中的各种工程方案（MWA、模块工程方案、Monorepo 工程方案）都是主要通过这一套模型运行的。而 Runtime 则主要负责的是 React 路由组件和元素的处理（Component 和 Element）和渲染（包括服务器端渲染和客户端渲染）。而 Server 则是针对 Server 运行时的这个阶段的生命周期运行和特殊信息收集。其中 Runtime 和 Server 的运行都是在 CLI 中触发的。
