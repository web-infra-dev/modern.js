---
sidebar_position: 3
---

# 发布正式版本

发版正式版本时，我们需要根据开发过程中生成的 changeset 进行相关包版本号升级，并执行 publish 命令发布到 NPM 上。

## 步骤

:::info
以下示例命令都以 pnpm 作为包管理工具进行，如果需要使用其他包管理工具，请按需求进行替换。
:::

### 模块工程方案

#### 在根目录执行以下命令：

```bash
pnpm run bump
```

![执行 bump 命令](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-module-bump.png)

执行该命令时，changeset 会自动进行以下操作：

- 删除 `.changesets` 目录下的所有 changeset 文件。

- 根据 changeset 信息升级该包版本号。

- 在根目录的 `CHANGELOG.md` 文件中写入 Changelog 信息，文件不存在时会自动创建。

#### 确认并提交当前变更：

```bash
git add .
git commit -m "release: bump package"
```

#### 在根目录执行以下命令发布包至 NPM：

```bash
pnpm run release
```

![执行 release 命令](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-module-release.png)

#### push 对应的 tag 信息至远程仓库：

```bash
git push --follow-tags
```

### Monorepo 工程方案

#### 在根目录执行以下命令：

```bash
pnpm run bump
```

![执行 bump 命令](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-monorepo-bump.png)

执行该命令时，changeset 会自动进行以下操作：

- 删除 `.changesets` 目录下的所有 changeset 文件。

- 根据 changeset 信息升级相关包的版本号，除了显示写入 changeset 的包，执行命令时还会将 Monorepo 中所有的包进行依赖关系分析，如果需要升级，也会对应的自动升级版本号。

- 在需要升级的包目录的 `CHANGELOG.md` 文件中写入 Changelog 信息，文件不存在时会自动创建。

#### 确认并提交当前变更：

:::info
需确认自动升级的版本号是否符合预期，如果需要了解版本升级策略，请查看[升级版本策略](/docs/guides/features/changesets/release#升级版本策略)。
:::

```bash
git add .
git commit -m "release: bump package"
```

#### 在根目录执行以下命令发布包至 NPM：

```bash
pnpm run release
```

执行该命令时，将会依次判断 Monorepo 中所有的 packages 的版本是否在 NPM 中存在，如果不存在将会执行 `publish` 命令发布。

:::warning
当 Monorepo 中包之间依赖关系使用 workspace 声明时，注意不要直接在 package 对应的子目录直接执行 `npm publish` 发布 package，使用 `relesae` 命令在发布时将会自动去除 workspace 声明，确保 NPM 包发布之后可用。
:::

#### push 对应的 tag 信息至远程仓库：

```bash
git push --follow-tags
```

## 参数

### bump 命令参数

- `--snapshot` 生成基于时间戳的版本号。

```bash
pnpm run bump -- --snapshot canary
```

执行完成后，对应的升级版本号将会变成 `0.0.0-canary-20220622092823` 的形式，其中 canary 为 snapshot 配置的标记，如果不配置，将直接生成 `0.0.0-20220622092823` 的形式。

该参数主要用于发布临时测试版本进行测试，不需要进行代码提交。

- `--ignore` 发布时手动忽略部分包。

例如本次发布你需要忽略 `module-2` 包：

```bash
pnpm run bump -- --ignore module-2
```

命令执行完成后，将会忽略 `module-2` 包的更新。注意如果存在包依赖 `module-2`，需要将对应包也加入到 `ignore` 参数中，否则 `bump` 命令将执行失败。

加入多个包的使用姿势为：

```bash
pnpm run bump -- --ignore module-2 --ignore module-3
```

### release 命令参数

- `--otp` 使用 `npm token` 执行 relesae 命令发布对应包

```bash
pnpm run relese -- --otp <token>
```

- `--tag` 本地发布使用特定的 tag，默认使用 `latest`

```bash
pnpm run release -- --tag <tag>
```

- `--ignore-scripts` 发布时忽略 npm scripts。

执行 `publish` 命令时，npm 会自动触发很多命令，比如 `prepare`、`prepublish`，使用该参数可以忽略这些命令执行。该参数仅支持在使用 pnpm 的 Monorepo 中使用。

```bash
pnpm run release -- --ignore-scripts
```

- `--no-git-checks` 发布时忽略检查当前分支。

执行发布命令时，默认会自动检查当前分支是否为发布分支，是否存在未提交变更等等，使用该参数可以忽略 git 相关检查。

```bash
pnpm run release -- --no-git-checks
```

## 升级版本策略

### dependencies 或者 devDependencies 依赖

#### patch 版本依赖只升级自身

例如存在如下场景：

Monorepo 中存在两个包，`module-1` 和 `module-2`，`module-2` 的 `dependencies` 中存在 `module-1`。

当前存在的 changeset 为 `module-1` 的 `patch` 版本升级。

执行 bump 命令后将只会升级 `module-1` 的 patch 版本号。

#### major / minor 版本自身升级 major 或者 minor 版本号，依赖包升级 patch 版本号

例如存在如下场景：

Monorepo 中存在两个包，`module-1` 和 `module-2`，`module-2` 的 dependencies 中存在`module-1`。

当前存在的 changeset 为 `module-1` 的 minor 版本升级。

执行 bump 命令后 `module-1` 会升级 `minor` 版本号，`module -2` 会升级 `patch` 版本号。

### peerDependencies 依赖

#### patch 版本依赖自身和依赖包都升级 patch 版本号

例如存在如下场景：

Monorepo 中存在两个包，`module-1` 和 `module-2`，`module-2` 的 `peerDependencies` 中存在 `module-1`。

当前存在的 changeset 为 `module-1` 的 patch 版本升级。

执行 bump 命令后将 `module-1` 和 `module-2` 都升级 patch 版本号。

#### major / minor 版本自身升级 major 或者 minor 版本号，依赖包升级 major 版本号

例如存在如下场景：

Monorepo 中存在两个包，`module-1` 和 `module-2`，`module-2` 的 `peerDependencies` 中存在 `module-1`。

当前存在的 changeset 为 `module-1` 的 `minor` 版本升级。

执行 bump 命令后将 module-1 将升级 `minor` 版本号， `module-2` 升级 `major` 版本号。

#### 修改 peerDependencies 的升级策略

`peerDependencies` 的升级策略支持通过配置 `onlyUpdatePeerDependentsWhenOutOfRange` 来修改依赖升级策略，当只有超出声明的版本类型范围时，才对应升级 `peerDependencies`。

```json
{
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "onlyUpdatePeerDependentsWhenOutOfRange": true
  },
  ...
}
```

例如存在如下场景：

Monorepo 中存在两个包，`module-1` 和 `module-2`，`module-2` 的 `peerDependencies` 中存在 `module-1`，声明 `module-1` 的版本号使用 `^`。

当前存在的 changeset 为 `module-1` 的 `patch` 或者 `minor` 版本升级。

执行 `bump` 命令后只升级 `module-1` 版本号。

需注意，如果包版本号在 `0.x.x` 的范围时，`minor` 版本号升级也是超出声明的版本类型范围的。
