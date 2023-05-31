---
sidebar_position: 2
---

# 类型

## 介绍

生成器插件分为两类：

- 扩展：Web 应用( Npm 模块) = Web 应用( Npm 模块) + 生成器插件

- 自定义：新应用(模块) = Web 应用(模块) + 生成器插件


简单理解就是扩展还是使用 Modern.js 原本的工程方案名称，自定义会创建一个新的名称。

## 标识

生成器插件的类型通过 `package.json` 中的 meta 字段来提供：

### 扩展

```json title="package.json"
{
 "meta": {
    "extend": "mwa" // module
 }
}
```

### 自定义

```json title="package.json"
{
 "meta": {
    "key": "new_app",
    "name": "新应用",
    "type": "mwa" // module 和 custom
 }
}
```

:::info
自定义类型的 type 支持 custom 类型，custom 为使用 Modern.js 提供的一些项目开发的最佳实践模板，比如 `.gitignore`、`.editorConfig` 等文件，其他业务相关代码模板需要手动通过生成器插件提供。
:::

## 创建初始项目

### 扩展

```bash
npx @modern-js/create@latest plugin --plugin @modern-js/generator-plugin-plugin
? 请选择你想创建的工程类型 Npm 模块
? 请选择项目场景 生成器插件
? 请输入生成器插件插件包名 plugin
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 请选择插件类型 extend
? 请选择插件基础类型 Web 应用
```

### 自定义

```bash
npx @modern-js/create@latest plugin --plugin @modern-js/generator-plugin-plugin
? 请选择项目类型 生成器插件
? 请选择项目组织方式 独立项目
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 请输入生成器插件插件包名 plugin
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 请选择插件类型 custom
? 请输入插件关键字 new_app
? 请输入插件展示名称 新应用
? 请选择插件基础类型 Web 应用
```

## 执行顺序

生成器插件支持同时使用多个，也就是执行 `@modern-js/create` 时支持多个 `--plugin` 参数。

### 扩展

扩展生成器插件支持在执行时会按照声明的生成器插件参数的顺序，依次执行对应 extend 的工程方案的生命周期函数。

例如存在 A 和 B 两个生成器插件，A 和 B 都是 extend 的 Web 应用工程方案，A 插件声明添加 `a.ts` 文件，B 插件声明添加 `b.ts` 文件，
执行 `npx @modern-js/create@latest --plugin A --plugin B` 时，选择 Web 应用工程时，会先生成 Web 应用默认的项目文件，然后执行 A 插件创建 `a.ts` 文件，再执行 B 插件，生成 `b.ts` 文件。

### 自定义

自定义生成器插件只支持同一时间运行一个生成器插件，当 `@modern-js/create` 声明 `--plugin` 参数时，会在选择工程方案之后增加选择工程方案场景选项，即为上述 `package.json` 中定义的新 name，选择对应 name 的生成器插件，即会在默认工程方案执行完成后，执行对应的生成器插件逻辑。声明 `--plugin` 参数时，工程方案场景下将会逐一列举出对应的生成器插件名称供选择。
