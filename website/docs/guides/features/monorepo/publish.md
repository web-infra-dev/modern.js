---
sidebar_position: 4
---

# 可复用模块的发布

在 Monorepo 中有时会需要把多个模块项目发布到 [NPM](https://www.npmjs.com/) 上，本章将要介绍如果在 Monorepo 中对子项目进行版本更新以及发布。

## 准备工作

接着 [子项目联调](/docs/guides/features/monorepo/sub-project-interface) 章节的例子，我们对 `components` 模块进行发布。

## 生成变更记录

在开发阶段，当某个模块的功能开完完成之后，一般需要提交代码（例如提交到 [GitHub](https://github.com/) 上）并需要记录本次修改的内容。在 Modern.js 的 Monorepo 工程中，我们可以在 monorepo 根目录执行命令：

```
pnpm run change
```

然后根据提示选择变更或者将要发布的包以及选择包升级的版本，并填写变更信息。变更信息的内容可以包含此次开发的功能、修复的问题等。

那么对于上面的例子，我们选择变更的项目为 `components`，并填写此次变更的内容：

```
$ modern change
🦋  Which packages would you like to include? · components
🦋  Which packages should have a major bump? · No items were selected
🦋  Which packages should have a minor bump? · components
🦋  Please enter a summary for this change (this will be in the changelogs). Submit empty line to open external editor
🦋  Summary · add features
🦋  === Releasing the following packages ===
🦋  [Minor]
🦋    components
🦋  ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
🦋  ║                                                      ========= NOTE ========                                                       ║
🦋  ║All dependents of these packages that will be incompatible with the new version will be patch bumped when this changeset is applied.║
🦋  ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
🦋  Is this your desired changeset? (Y/n) · true
🦋  Changeset added! - you can now commit it
🦋
🦋  If you want to modify or expand on the changeset summary, you can find it here
🦋  info /Users/demo/modern-js/official/monorepo-pnpm/.changeset/silent-tigers-run.md
```

该命令完成后，在 `.changeset` 中会有新的 `silent-tigers-run.md` 文件生成，其中包含了刚刚填写的信息，这些新生成的文件将用于后面发布流程中使用。**因此在提交代码的时候，需要将`.changeset` 目录下的文件一并提交**。

## 版本更新

在模块发布之前，还需要将模块的版本进行更新。。在 Modern.js 的 Monorepo 工程中，可以在 Monorepo 项目根目录下执行：

```
pnpm run bump
```

该命令会根据之前生成在 `.changeset` 目录下的文件自动更新对应模块的版本号和 CHANGELOG 信息，执行成功后会看到：

```
🦋  All files have been updated. Review them and commit at your leisure
```

## 发布

最后执行 `pnpm run prepare --filter {./packages} && pnpm run release`，便可以发布对应的模块了。

:::info 补充信息
在上面的命令中 --filter {./packages} 用于筛选位于 `./packages` 目录下的子项目，可以通过 [PNPM Filtering](https://pnpm.io/filtering) 来了解更多它的使用。
:::
