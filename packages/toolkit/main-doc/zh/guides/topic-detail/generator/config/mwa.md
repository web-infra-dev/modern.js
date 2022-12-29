---
sidebar_position: 2
---

# 应用

## 项目创建

创建项目时配置，`@modern-js/create` 使用 `--config` 参数时使用的配置，也是在生成器插件中修改和添加 input 时使用的配置。

应用项目创建参数都为[通用配置](/docs/guides/topic-detail/generator/config/common)。

## New 命令

应用项目中 new 命令配置， 可以在执行 new 命令时通过 `--config` 参数配置，也可在生成器插件中创建元素和启用功能时使用。

### actionType

New 命令的操作类型(actionType)，类型支持两种：

- element 创建工程元素

- function 启用功能

:::info
在生成器插件中使用启用功能和创建元素时不需要该参数，生成器插件中自动添加该参数。
:::

### element

元素名称(element)，支持两个选项：

- 创建应用入口(entry)

- 新建自定义 Web Serve 源码目录(server)

入口还需要配置具体的配合使用，介绍如下：

#### name

入口名称(name), 字符串类型。

### function

可选功能名称(function)，支持如下选项:

- Tailwind CSS(tailwindcss)

- BFF(bff)

- SSG(ssg)

- 微前端(micro_frontend)

- 单元测试(test)

- Storybook(mwa_storybook)

- 启用「基于 UA 的 Polyfill」功能(polyfill)

- 启用「全局代理」(proxy)

`bff` 和还需要配置具体的配合使用，介绍如下：

#### BFF 相关参数

##### bffType

BFF 类型(bffType)，支持两个选项：

- 函数模式(function)

- 框架模式(framework)

##### framework

BFF 运行时框架(framework)，支持两个选项：

- Express(express)

- Koa(koa)
