---
sidebar_position: 2
---

# CLI 参数

`@modern-js/create` 提供了很多配置参数用于配置其执行过程中的行为，可以通过 --help 参数进行查看：

```bash
npx @modern-js/create@latest --help

Usage: npx @modern-js/create@latest [projectDir]

创建 @modern-js 应用

Options:
  --version                当前 create 工具版本号
  --lang <lang>            设置 create 工具语言(zh 或者 en)
  -c, --config <config>    创建项目默认配置(JSON 字符串) (default: "{}")
  -d,--debug               开启 Debug 模式，打印调试日志信息 (default: false)
  --mwa                    一键创建 Web 应用(使用默认配置) (default: false)
  --module                 一键创建 Module 应用(使用默认配置) (default: false)
  --monorepo               一键常见 Monorepo 应用(使用默认配置) (default: false)
  --generator <generator>  使用自定义生成器
  -p, --plugin <plugin>    使用生成器插件创建新的工程方案类型或定制化 Modern.js 工程方案 (default: [])
  --dist-tag <distTag>     生成项目时生成器使用特殊的 npm Tag (default: "")
  --packages <packages>    创建项目指定特定依赖版本信息 (default: "{}")
  --registry <registry>    在创建过程中定制 npm Registry (default: "")
  --no-need-install        无需安装依赖
  -h, --help               display help for command

Commands:
  clean-cache              清除本地生成器缓存
```

下面将针对这些参数做详细介绍：

## [projectDir]

项目目录名称。

执行 `@modern-js/create` 时，默认会在当前目录创建 `projectDir` 文件夹，并在该文件夹下初始化项目。该参数为空时，将会在当前目录直接生成初始化项目。

:::info
如果 `projectDir` 所在目录内容不为空，将会提示是否继续创建，推荐在空目录下进行项目初始化操作。
:::

## --version

获取 `@modern-js/create` 工具版本。

```bash
npx @modern-js/create@latest --version

[INFO] @modern-js/create v2.21.1
```

## --lang \<lang>

执行执行语言，支持 `zh` 和 `en`。

默认情况下，`@modern-js/create` 会自动识别用户的系统语言，选择使用中文或者英文，如果识别失败或者不符合使用习惯，可以使用该参数手动指定。

## -c, --config \<config>

指定项目默认配置。

默认情况下，`@modern-js/create` 在执行过程中会出现选择语言、包管理工具等交互问题，当需要提前指定这些配置内容时，可以通过该字段传入。

该字段为 JSON 字符串，例如需指定包管理工具时：

```bash
npx @modern-js/create@latest --config '{"packageManager": "pnpm"}'
```

`config` 支持的参数可查看[配置参数](/guides/topic-detail/generator/create/config.html)。

## -d,--debug

展示调试日志。

当在使用过程中遇到问题时，可以使用该参数显示调试日志，方便快速定位问题位置及对问题进行排查。

## --mwa

快速创建 Web 应用项目。

## --module

快速创建 Npm 模块项目。

## --monorepo

快速创建 Monorepo 项目。

## -p, --plugin \<plugin>

指定生成器插件。

<!-- TODO 详情可查看[开发生成器插件]-->

`@modern-js/create` 支持使用生成器插件定制 Modern.js 默认的工程方案类型或者添加工程方案类型场景。

## --generator \<generator>

指定微生成器。

<!-- TODO 详情可查看[开发微生成器]-->
`@modern-js/create` 支持使用微生成器完全定制项目生成流程。

## --dist-tag \<distTag>

指定生成器及 Modern.js 相关依赖版本。

`@modern-js/create` 执行过程中会执行更小的微生成器，默认会使用 `latest` 的微生成器版本，使用该参数可以指定执行的微生成器的版本号和对应的安装 Modern.js 相关依赖的版本。

比如使用 `next` 版本：

```bash
npx @modern-js/create@next --dist-tag next
```

## --packages \<packages>

创建项目是指定特定包版本依赖。

在创建项目时如果有需要指定特定包版本，可以使用该参数。该参数会在项目根目录的 `package.json` 中配置 `pnpm.overrides`(包管理工具选择 pnpm) 或者 `resolutions` 锁定包版本号。

该参数值为 JSON 字符串。

例如指定 react 版本：

```bash
npx @modern-js/create@latest --packages '{"react":"^17"}'
```

## --registry \<registry>

指定执行子生成器和获取项目依赖版本的 npm registry。

## --no-need-install

忽略自动安装依赖。

默认情况下，`@modern-js/create` 在创建项目完成后会自动安装依赖，使用该参数可以忽略安装依赖步骤。

## clean-cache

`@modern-js/create` 默认会在执行机器的 tmp 目录生成子生成器缓存用于加快生成器执行速度，在需要刷新缓存或者缓存出现问题时可以使用该命令删除缓存。

```bash
npx @modern-js/create@latest clean-cache
```
