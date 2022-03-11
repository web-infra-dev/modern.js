---
sidebar_position: 1
---

# 介绍

Modern.js 提供了应用、模块、项目组三种工程方案类型，并支持通过 `@modern-js/create` 创建工程方案初始化项目。

使用 `@modern-js/create` 时会询问用户一些问题来生成符合用户需求的项目，这一章将介绍这里的问题字段便于进行定制化工程方案开发时使用。

:::info
配置章节将使用同时介绍内容和字段值的方式，括号中内容为对应的字段值
:::

## 工程方案配置

### Solution

工程方案类型(solution)，共三个选项：

- 应用(mwa)

- 模块(module)

- 项目组(monorepo)

:::info
solution 配置只能在 config 参数中使用，不能在生成器插件中通过设置输入默认值的方式使用。
:::

## 通用配置

### Language

开发语言(language)，共有两个选项：

- TS(ts)

- ES6+(js)

### Package-Manager

包管理工具(packageManager)，共有两个选项：

- pnpm(pnpm)

- Yarn(yarn)


:::info
在生成器插件创建工程方案场景的自定义类型中，默认只提供了 `packageManager` 配置。
:::