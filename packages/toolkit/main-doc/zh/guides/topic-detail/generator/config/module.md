---
sidebar_position: 3
---

# 模块

## 项目创建

创建项目时配置，`@modern-js/create` 使用 `--config` 参数时使用的配置，也是在生成器插件中修改和添加 input 时使用的配置。

模块项目默认包含通用配置，通用配置可查看[通用配置](/docs/guides/topic-detail/generator/config/common)。

### packageName

包名(packageName)，字符串类型，为输入值。

## New 命令

模块项目中 new 命令配置， 可以在执行 new 命令时通过 `--config` 参数配置，也可在生成器插件中创建元素和启用功能时使用。

### actionType

New 命令的操作类型(actionType)，类型支持一种：

- function 启用功能

:::info
在生成器插件中使用启用功能和创建元素时不需要该参数，生成器插件中自动添加该参数。
:::

### function

可选功能名称(function)，支持如下选项:

- Tailwind CSS(tailwindcss)

- Storybook(mwa_storybook)

- Runtime API(runtimeApi)
