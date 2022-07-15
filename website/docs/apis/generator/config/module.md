---
sidebar_position: 3
---

# 模块

模块项目默认包含通用配置，通用配置可查看[通用配置](/docs/apis/generator/config/introduce#通用配置)。

## 创建项目

创建项目时配置，`@modern-js/create` 使用 `--config` 参数时使用的配置，也是在生成器插件中修改和添加 input 时使用的配置。

### Package-Name

包名(packageName)，字符串类型，为输入值。

### Need-Modify-Module-Config

是否需要修改模块默认配置(needModifyModuleConfig)。

该配置值为 `yes` 时，后续配置才会展示给用户。

在使用 `--config` 参数或者在生成器插件中时，配置值为 `yes` 后续配置才会生效。

该字段共有两个选项：

- 是(yes)

- 否(no)

### Enable-Less

是否启用 Less 支持(enableLess)，默认为不启用，共有两个选项：

- 是(yes)

- 否(no)

### Enable-Sass

是否启用 Sass 支持(enableSass), 默认为不启用，共有两个选项：

- 是(yes)

- 否(no)

## New 命令

模块项目中 new 命令配置， 可以在执行 new 命令时通过 `--config` 参数配置，也可在生成器插件中创建元素和启用功能时使用。

### Action-Type

New 命令的操作类型(actionType)，类型支持一种：

- function 启用功能

:::info
在生成器插件中使用启用功能和创建元素时不需要该参数，生成器插件中自动添加该参数。
:::

### Function

可选功能名称(function)，支持 11 个选项:

- Tailwind CSS(tailwindcss)

- Less(less)

- Sass(sass)

- Storybook(mwa_storybook)

- Runtime API(runtimeApi)
