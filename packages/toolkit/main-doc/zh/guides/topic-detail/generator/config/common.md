---
sidebar_position: 1
---

# 通用配置

### solution

工程方案类型(solution)，选项如下：

- 应用(mwa)

- 模块(module)

- Monorepo

:::info
solution 配置只能在 `@modern-js/create` 的 `--config` 参数中使用，不能在生成器插件中通过设置输入默认值的方式使用。
:::

### scenes

项目场景(scenes)，当使用创建工程方案场景类型的生成器插件时，该值为对应生成器插件的 key 值。

:::info
scenes 配置只能在 `@modern-js/create` 的 `--config` 参数中使用，不能在生成器插件中通过设置输入默认值的方式使用。
:::

### language

开发语言(language)，选项如下：

- TS(ts)

- ES6+(js)

### packageManager

包管理工具(packageManager)，选项如下：

- pnpm(pnpm)

- Yarn(yarn)


:::info
在生成器插件创建工程方案场景的自定义类型(custom)中，默认只提供了 `packageManager` 配置。
:::

## 其他配置

### noNeedInstall

* Type: Boolean

* Default: false

是否跳过依赖安装。

### noNeedGit

* Type: Boolean

* Default: false

是否跳过 git 初始化和提交初始 commit。

### successInfo

* Type: String

* Default: 不同工程方案的命令操作提示

自定义创建项目成功的提示信息。

### isMonorepoSubProject

* Type: Boolean

* Default: false

是否为 Monorepo 子项目。

### isTest

* Type: Boolean

   - true: 创建到路径 `examples/`

   - false: 创建到路径 `apps/`

* Default: false

作用于 `应用(MWA)` 项目，标识是否为测试项目。

### isPublic

* Type: Boolean

   - true: 创建到路径 `packages/`

   - false: 创建到路径 `features/`

* Default: false

作用于 `模块(Module)` 项目，标识是否需要对外发布。
