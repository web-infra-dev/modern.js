---
sidebar_position: 2
---

# 项目生成器

Modern.js 提供了 `@modern-js/create` 作为项目生成器用于进行 Modern.js 工程方案项目创建。

## 使用

不需要全局安装 `@modern-js/create`，直接使用 npx 执行该工具即可：

```bash
npx @modern-js/create [projectDir]
```

:::info
使用 npx 可以每次获取最新版本的 `@modern-js/create`。
:::

## 参数

### [projectDir]

项目目录名称。

执行上述命令时，默认会在当前目录创建 `projectDir` 文件夹，并在该文件夹下初始化项目。该参数为空时，将会在当前目录直接生成初始化项目。

### --version

获取 `@modern-js/create` 工具版本。

```bash
$ npx @modern-js/create --version

[INFO] @modern-js/create v2.0.0
```

### --lang

指定执行语言，支持 `zh` 和 `en`。

默认情况下，`@modern-js/create` 会自动识别用户的系统语言，选择使用中文或者英文，如果识别失败或者想手动指定语言，可以使用该参数。

### -c, --config

指定项目默认配置。

默认情况下，`@modern-js/create` 在执行过程中会出现选择语言、包管理工具等交互问题，当需要提前指定这些配置内容时，可以通过该字段传入。

该字段为 JSON 字符串，例如需执行包管理工具时：

```bash
npx @modern-js/create --config '{"packageManager": "pnpm"}'
```

具体配置信息可查看[工程方案配置](/docs/guides/topic-detail/generator/config/common)。

### --no-need-install

默认情况下，`@modern-js/create` 在创建项目完成后会自动安装依赖，使用该参数可以忽略安装依赖步骤。

### --dist-tag <distTag\>

指定生成器及 Modern.js 相关依赖版本。

`@modern-js/create` 执行过程中会执行更小的微生成器，使用该参数可以执行执行的微生成器的版本号和对应的安装 Modern.js 相关依赖的版本号。

### --registry <registry/>

执行获取生成器及 npm 包的 npm registry。

### --debug

显示生成器执行过程中的调试日志信息。

### --mwa

一键创建应用工程方案项目。

使用该参数后，`@modern-js/create` 将会使用配置默认值创建应用项目。

### --module

一键创建模块工程方案项目。

使用该参数后，`@modern-js/create` 将会使用配置默认值创建模块项目。

### --monorepo

一键创建 Monorepo 工程方案项目。

使用该参数后，`@modern-js/create` 将会使用配置默认值创建 Monorepo 项目。

### --plugin <plugin\>

指定生成器插件。

Modern.js 支持使用生成器插件定制 Modern.js 默认的工程方案类型或者添加工程方案类型场景，该参数用户指定定制的生成器插件。

关于定制生成器插件可以参考[开发生成器插件](/docs/guides/topic-detail/generator/plugin/abstract)。

### --generator <generator\>

指定微生成器。

默认情况下 `@modern-js/create` 会执行 Modern.js 框架内置的微生成器，如果你需要执行定制的微生成器，又需要使用 `npx @modern-js/create` 的姿势，可直接使用该参数。

关于定制微生成器可以参考[开发微生成器](/docs/guides/topic-detail/generator/codesmith/introduce)。

### --packages <packages\>

创建项目是指定特定包版本依赖。

在创建项目时如果有需要指定特定包版本，可以使用该参数。该参数会在项目根目录的 `package.json` 中配置 `pnpm.overrides`(包管理工具选择 pnpm) 或者 `resolutions` 锁定包版本号。

该参数值为 JSON 字符串。
