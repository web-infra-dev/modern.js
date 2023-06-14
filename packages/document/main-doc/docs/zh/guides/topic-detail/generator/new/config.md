---
sidebar_position: 3
---

# 配置参数

`new` 命令提供了 [--config](/guides/topic-detail/generator/new/option.html#-c,---config-<config>) 参数，用于提前指定执行过程中交互问题的答案。

这里将介绍不同情况下，可以在 `config` 中配置的字段及字段值。

## 通用配置

### actionType

问题：请选择你想要的操作

选项：

- 创建工程元素 -- element

- 启用可选功能 -- function

- 自动重构 -- refactor

## Web 应用

### element

问题：请选择创建元素类型

选项：

- 新建「应用入口」 -- entry

- 新建「自定义 Web Server」源码目录 -- server

### name

问题： 请填写入口名称

:::info
新建应用入口时需要该配置，该配置值为字符串类型。
:::

### function

问题：请选择功能名称

选项：

- 启用「Rspack 构建」 -- rspack

- 启用 「Tailwind CSS」 支持 -- tailwindcss

- 启用「BFF」功能 -- bff

- 启用「SSG」功能 -- ssg

- 启用「SWC 编译」-- swc

- 启用「微前端」模式 -- micro_frontend

- 启用「单元测试 / 集成测试」功能 -- test

- 启用「基于 UA 的 Polyfill」功能 -- polyfill

- 启用「全局代理」 -- proxy

- 启用「Visual Testing (Storybook)」模式 -- mwa_storybook

### bffType

问题：请选择 BFF 类型

选项：

- 函数模式 -- func

- 框架模式 -- framework

:::info
启用 BFF 功能时需要该配置。
:::

### framework

问题：请选择运行时框架

选项：

- Express -- express

- Koa -- koa

:::info
启用 BFF 功能时需要该配置。
:::

### refactor

问题：请选择重构类型

选项：

- 使用 React Router v5 -- react_router_5

## Npm 模块

### function

问题：启用可选功能

选项：

- 启用「单元测试 / 集成测试」功能 -- test

- 启用 「Tailwind CSS」 支持 -- tailwindcss

- 启用「Storybook」 -- storybook

- 启用「Runtime API」 -- runtime_api

## Monorepo

### sub_solution

问题：请选择你想创建的工程类型

选项：

- Web 应用 -- mwa

- Web 应用（测试）-- mwa_test

- Npm 模块 -- module

- Npm 模块（内部）-- inner_module

### packageName

问题：请填写子项目名称

:::info
子项目的 `package.json` 的 name 字段值，该配置值为字符串类型。
:::

### packagePath

问题：请填写子项目目录名称

:::info
子项目基于 apps 或者 packages 目录的子目录名称，该字段为字符串类型。
:::
