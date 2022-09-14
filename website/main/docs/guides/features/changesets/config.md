---
sidebar_position: 5
---

# Changesets 配置文件

我们前面了解到，初始化 Modern.js 仓库时，会默认初始化 Changesets 的配置文件，即 `.changeset/config.json` 文件，下面我们将详细了解一下该文件中支持哪些配置。

## 配置介绍

### commit

类型： `boolean`

默认值： `false`

当配置该字段为 `true` 时，在执行 `change` 和 `bump` 命令时，将自动执行提交代码操作。

默认的 commit 信息格式如下：

![change commit](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-change-commit-info.png)
![bump commit](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-bump-commit-info.png)

该 commit 信息支持自定义，我们将在[自定义提交 commit 信息](/docs/guides/features/changesets/commit)章节进行详细介绍。

### access

类型：`restricted` | `public`

默认值：`restricted`

用于配置当前包的发布形式，如果配置为 `restricted`，将作为私有包发布，如果为 `public`，则发布公共范围包。

对于仓库中存在部分包需要配置 access，可以在 `package.json` 中配置 `publishConfig`，例如：

```json title=package.json
{
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  }
}
```

对于不需要发布的包，可以在 `package.json` 中设置 `private` 为 `true`，阻止其进行发布。

### baseBranch

类型： `string`

默认值： `main`

仓库主分支。该配置用于计算当前分支的变更包并进行分类。

### ignore

类型：`string[]`

默认值：`[]`

用于声明执行 `bump` 命令时忽略的包，和 `bump` 命令的 `--ignore` 参数用法一致，注意两者不能同时使用。

### fixed

类型： `string[][]`

默认值：`[]`

用于 monorepo 中对包进行分组，相同分组中的包版本号将进行绑定，每次执行 `bump` 命令时，同一分组中的包只要有一个升级版本号，其他会一起升级。
支持使用正则匹配包名称。

### linked

类型： `string[][]`

默认值：`[]`

和 `fixed` 类似，也是对 monorepo 中对包进行分组，但是每次执行 `bump` 命令时，只有和 changeset 声明的变更相关的包才会升级版本号，同一分组的变更包的版本号将保持一致。
支持使用正则匹配包名称。

### updateInternalDependencies

类型：`patch` | `minor`

默认值：`patch`

用于声明更新内部依赖的版本号规则。

当执行 `bump` 命令升级版本号时，默认会自动更新仓库中使用该包的依赖声明。配置该字段为 `minor` 后，如果升级版本号为 `patch` 类型，将不会自动更新引用依赖声明。

例如：
```
pkg-a @ version 1.0.0
pkg-b @ version 1.0.0
  depends on pkg-a at range `^1.0.0
```

默认情况下，升级 `pkg-a` 至 `1.0.1` 时，会更新 `pkg-b` 中的 `pkg-a` 的依赖版本为 `^1.0.1`。

当配置 `updateInternalDependencies` 为 `minor` 时，升级 `pkg-a` 至 `1.0.1` 时，`pkg-b` 中的 `pkg-a` 的依赖版本将不会更新，只有 `pkg-a` 升级版本号为 `1.1.0` 或者 `2.0.0` 时，才会更新 `pkg-b` 中的 `pkg-a` 的依赖。

### changelog

类型：`boolean` | `string` | `[string, unknow]`

默认值：`@changesets/cli/changelog`

生成 Changelog 规则。

配置为 `false` 时，执行 bump 命令时，在 `CHANGELOG.md` 文件中只声明版本号，不声明其他 Changelog 信息。

![关闭 changelog 配置](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-empty-changelog.png)

配置为 `@changesets/cli/changelog` 将使用官方提供的 Changlog 生成规则，将 changeset 信息转换为 Changlog 内容。

配置为数组时，第一个参数为自定义 NPM 包或者路径，第二个参数为需要传入的默认参数配置，自定义格式我们将在后续[自定义 Changelog](/docs/guides/features/changesets/changelog) 章节讲解。

### ___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH

一些实验性配置。

#### onlyUpdatePeerDependentsWhenOutOfRange

类型：`boolean`

默认值：`false`

针对于 `peerDependence` 依赖的升级策略配置，默认针对 `peerDependence` 在 `minor` 和 `major` 版本升级时，当前包会升级大版本。

该配置设置为 true 时，仅当 `peerDependence` 声明包依赖超出声明范围时才更新版本。

#### updateInternalDependents

类型： `always` | `out-of-range`

默认值：`always`

当执行 `bump` 命令升级版本号时，默认会自动更新仓库中使用该包的依赖声明。当设置该参数为 `out-of-range` 时，只有当依赖声明超出范围时才会更新仓库中使用该包的依赖声明。

#### useCalculatedVersionForSnapshots

类型：`boolean`

默认值：`false`

使用快照发布时，默认会使用 `0.0.0-timestamp` 的版本格式，保证用户可以正常使用预发布版本。当你需要忽略上述问题，使用正常的版本号格式时，即当前版本为 `1.0.1` 快照版本期望使用`1.0.1-timestamp`，可配置该参数为 `true`。
