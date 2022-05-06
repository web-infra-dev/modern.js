---
sidebar_position: 1
---

# 插件可以做什么

Modern.js 内置了一套插件系统，并基于这套插件系统来管理各个运行流程，Modern.js 的所有工程方案都是通过这套插件实现的，同时也支持开发者通过编写插件来扩展更多功能，适配复杂场景。

由于 Modern.js 是基于这套插件系统实现的，因此可以说，Modern.js 中的所有能力是都对开发者开放的。包括但不限于：

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

因此，当 Modern.js 暂时没有覆盖到你所需要的功能或场景时，可以开发一个自定义插件，来实现适配特殊场景的相关功能。

:::info 补充信息
关于 Modern.js 插件 API 的详细介绍，请参考 【[插件 API](/docs/apis/runtime/plugin/abstract)】。
:::
