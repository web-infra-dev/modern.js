---
sidebar_position: 2
---

# 应用

应用项目默认包含通用配置，通用配置可查看[通用配置](/docs/configure/generator/introduce#通用配置)。

## 创建项目

创建项目时配置，`@modern-js/create` 使用 `--config` 参数时使用的配置，也是在生成器插件中修改和添加 input 时使用的配置。

### Need-Modify-MWA-Config

是否需要修改应用默认配置(needModifyMWAConfig)。

该配置值为 `yes` 时，后续配置才会展示给用户。

在使用 `--config` 参数或者在生成器插件中时，配置值为 `yes` 后续配置才会生效。

该字段共有两个选项：

- 是(yes)

- 否(no)

### Client-Route

客户端路由配置(clientRoute)，默认为自控路由，共有两个选项：

- 自控路由(selfControlRoute)

- 约定式路由(conventionalRoute)

## New 命令

应用项目中 new 命令配置， 可以在执行 new 命令时通过 `--config` 参数配置，也可在生成器插件中创建元素和启用功能时使用。

### Action-Type

New 命令的操作类型(actionType)，类型支持两种：

- element 创建工程元素

- function 启用功能

:::info
在生成器插件中使用启用功能和创建元素时不需要该参数，生成器插件中自动添加该参数。
:::

### Element

元素名称(element)，支持两个选项：

- 创建应用入口(entry)

- 新建 Server 自定义源码目(server)

这两个选项还需要配置具体的配合使用，介绍如下：

#### Name

入口名称(name), 字符串类型。

创建入口除了`name`之外，还需要 `needModifyMWAConfig`、`clientRoute` 字段。

#### Framework

自定义 Server 运行时框架(framework)，支持四个选项：

- Egg(egg)

- Express(express)

- Koa(koa)

- Nest(nest)

### Function

可选功能名称(function)，支持如下选项:

- Tailwind CSS(tailwindcss)

- Less(less)

- Sass(sass)

- BFF(bff)

- SSG(ssg)

- 微前端(micro_frontend)

- 单元测试(test)

- Storybook(mwa_storybook)

- 部署(deploy)

- 启用「基于 UA 的 Polyfill」功能(polyfill)

- 启用「全局代理」(proxy)

`bff` 和 `deploy` 和还需要配置具体的配合使用，介绍如下：

#### BFF 相关参数

##### BFF-Type

BFF 类型(bffType)，支持两个选项：

- 函数模式(function)

- 框架模式(framework)

##### Framework

扩展 Web Server 运行时框架(framework)，支持四个选项：

- Egg(egg)

- Express(express)

- Koa(koa)

- Nest(nest)
