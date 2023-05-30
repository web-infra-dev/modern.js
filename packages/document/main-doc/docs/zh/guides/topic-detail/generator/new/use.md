---
sidebar_position: 1
---

# 使用

在 Web 应用、 Npm 模块和 Monorepo 项目中，我们提供了 `new` 命令用于创建项目元素、开启功能和创建子项目。

## Web 应用

Web 应用项目通过 `@modern-js/app-tools` 提供 `new` 命令。

new 命令提供了三种操作类型：

- 创建工程元素

- 启用可选功能

- 自动重构

每种操作类型都提供了对应支持的列表，可根据项目情况进行选择。

例如：

创建新的应用入口：

```bash
npm run new
? 请选择你想要的操作 创建工程元素
? 请选择创建元素类型 新建「应用入口」
? 请填写入口名称 entry
```

执行完成后将会在项目 `src` 目录创建新入口对应名称的文件夹及默认入口文件，并且自动帮忙整理之前 `src` 下入口文件到 `package.json` 中 `name` 字段对应的文件夹中。

开启 BFF 功能：

```bash
npm run new
? 请选择你想要的操作 启用可选功能
? 请选择功能名称 启用「BFF」功能
? 请选择运行时框架 Express
```

执行完成后将会在项目安装 BFF 相关依赖，并创建 api 目录用于 BFF 模块的开发并提供提示信息用于注册 BFF 插件。

:::info
这里未帮助用户自动注册插件，原因是由于 `modern.config.[tj]s` 在项目生命周期中变化比较复杂，可能存在模块之间互相引用问题，让用户手动注册能保证修改配置的正确性。

在后续定制化的开发中，如果有类似的需求，也可以通过提示的方式给到使用方操作指南，让用户对文件进行手动操作。
:::

:::warning
执行 new 命令时可能会出现需要开启的功能不在列表中，需要检查一下项目 `package.json` 中是否已经安装对应功能的插件，如果仍需使用 new 命令开启，需要先手动移除对应的插件依赖。
:::

## Npm 模块

Npm 模块项目通过 `@modern-js/module-tools` 提供 new 命令。

new 命令提供了启用可选功能的能力。

例如：

开启 Storybook 能力：

```bash
npm run new
? 请选择你想要的操作 启用可选功能
? 请选择功能名称 启用「Storybook」
```

执行完成后将会在项目安装 Storybook 插件相关依赖，增加 `storybook` 命令，创建 `stories` 目录用于 Storybook 模块的开发并提供提示信息用于注册 Storybook 插件。

## Monorepo

Monorepo 项目通过 `@modern-js/monorepo-tools` 提供 new 命令。

new 命令提供了创建子项目的能力。

例如：

创建 Web 应用子项目：

```bash
? 请选择你想创建的工程类型 Web 应用
? 请填写子项目名称 web_app
? 请填写子项目目录名称 web_app
? 请选择开发语言 TS
? 请选择构建工具 webpack
```

执行完成后将会在项目 apps 目录创建 `web_app` 的子项目，在子项目目录中依然可以执行 new 命令创建项目元素和开启功能。
