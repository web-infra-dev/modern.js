---
sidebar_position: 1
---

# 认识 Changesets

Modern.js 默认集成了 [Changesets](https://github.com/changesets/changesets) 用于模块和 Monorepo 工程方案项目中的包版本管理。

## 特点

Changesets 具有以下几个特点：

- 在开发时，需要开发者提供本次变更涉及的包名称、升级版本类型(`pathch`、`minor`、`major`)及变更信息，即 changeset。

- 在发布版本时，会根据 changeset 自动升级对应包的版本号，并在对应的包中生成 Changelog 信息。

- 在 Monorepo 场景中，changeset 会自动生成仓库依赖图，升级时只会升级变更包及相关依赖包的版本号。

## 初始化

Modern.js 默认创建的模块和 Monorepo 工程方案项目已经初始化完成 Changesets，在项目根目录会自动创建 `.changeset` 目录，及 `.changeset/config.json` 的配置文件。

并且，Modern.js 在其对应的工程方案工具 `@modern-js/module-tools` 和 `@modern-js/monorepo-tools` 提供了 Changesets 相应的命令，无需再手动安装 Changesets 相关依赖。


Changesets 默认配置如下：

```json title=".changeset/config.json"
{
  "$schema": "https://unpkg.com/@changesets/config@2.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

配置文件提供了生成 Changesets 的一些基本配置，字段详细介绍请参考后续章节： [Changesets 配置文件](/docs/guides/features/changesets/config)。

## 命令

- `change` 创建一个 changeset，执行完成该命令后会自动在 `.changeset` 目录生成一个 changeset 文件。

- `bump` 根据当前 changeset 升级对应包版本号。

- `pre` 标记进入和退出 `pre release` 模式，在 `pre release` 模式下执行 `bump` 命令，将会生成 `x.x.x-${pre-tag}.x` 的版本号格式。

- `release` 发布包到 NPM。

- `status` 查看当前 changeset 状态。

- `gen-release-note` 根据当前的 chagneset 状态生成 Release Note 信息。

具体命令支持的参数可以查看后续对应章节介绍。
