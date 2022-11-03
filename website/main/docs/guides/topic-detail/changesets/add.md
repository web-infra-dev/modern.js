---
sidebar_position: 2
---

# 添加一个 changeset

当我们开发完成一个功能时，需要添加一个 changeset 用于声明当前功能，用于后续版本发布。

## 信息

一个 changeset 包含的内容包括：

- 本次变更涉及哪些包的变更。

- 本次变更需要升级的版本号类型，类型符合 [semver](https://semver.org/) 规范。

- 本次变更的 Changelog 信息。

## 步骤

:::info
以下示例命令都以 pnpm 作为包管理工具进行，如果需要使用其他包管理工具，请按需求进行替换。
:::

### 模块工程方案

#### 在根目录执行以下命令：

```bash
pnpm run change
```

#### 选择本次变更需要升级的版本号类型，点击回车：

![选择版本类型](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-select-version.png)

#### 填入 Changelog 信息，并点击两次回车：

![写入变更信息](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-input-changelog.png)

执行完成后，将在项目的 `.changeset` 目录创建对应的 changeset 文件，文件内容如下：

```markdown
---
'module-changeset': patch
---

feat: test module solution changeset

```

该文件中包含了 changeset 的所有信息。

### Monorepo 工程方案

我们假设 monorepo 中存在三个模块包，分别为 `module-1`，`module-2`，`module-3`。

#### 在根目录执行以下命令：

```bash
pnpm run change
```

#### 选择本次需要升级的包列表：

Changesets 会根据当前代码变更(`git diff Head...baseBranch`)，将 Monorepo 中的 package 分为两类，`changed packages` 和 `unchanged packages`，方便用户进行选择。

使用空格键选择对应的包或者分类即可，选择完成后点击回车：

![选择升级包](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-select-packages.png)

#### 分别选择不同版本类型对应的包，changeset 会询问 `major` 和 `minor` 类型，如果存在包未选择这两种类型，将会默认使用 `patch` 类型：

![选择升级包版本类型](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-auto-select-patch.png)

#### 填入 Changelog 信息，并点击两次回车：

![写入变更信息](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-input-changelog-monorepo.png)

执行完成后，将在项目的 `.changeset` 目录创建对应的 changeset 文件，文件内容如下：

```markdown
---
'module-2': minor
'module-3': patch
---

feat: test-changeset
```

该文件中包含了 changeset 的所有信息，不同的包也会根据选择的版本类型进行标记。

## 参数

change 命令支持以下参数：

- `--empty` 添加一个空的 changeset。

```bash
pnpm run change -- --empty
```

执行完成后，将在项目的 `.changeset` 目录创建空的 changeset 文件，文件内容如下：

```markdown
---
---
```

- `--open` 使用该参数时，在填写 Changelog 步骤会打开系统默认编辑器进行填写。

## 注意事项

- 不是所有的变更都需要 changeset

如果当前变更是修改仓库的一些基础设施，比如 CI、测试等，就不需要添加 changeset 或者可以添加一个空的 changeset。

-  一个 pull reuqest 可以提交多个 changeset

当一个 pull request 存在多个功能开发或者问题修复时，可以多次执行 `pnpm run change` 添加多个 changeset 文件，每个文件选择对应功能的包和添加变更信息即可。

- 创建 changeset 时，需要选择该功能相关的所有包

在 Monorepo 中创建 changeset 时，需要选中和该功能相关的所有变更包，避免出现发版时部分包未发布的情况。

