---
sidebar_position: 5
---

# 应用项目的部署

本章将要介绍如何在 Monorepo 中对应用项目进行部署。

所谓的 “在 Monorepo 中对应用项目进行部署” 更像是应用项目部署到服务器的前置工作。应用项目的功能一般来自以下部分

- 自身的代码逻辑功能
- 第三方的依赖
- Monorepo 中其他子项目提供的逻辑功能

而在将应用项目放到部署服务器之前，需要对应用项目、第三方依赖以及它所依赖的子项目做整合处理。

Modern.js 为 Monorepo 工程提供了部署功能，该功能可以为要部署的项目生成一个最小集合的 Monorepo，在这个 Monorepo 当中包含应用项目以及其依赖的子项目。

我们以 [子项目联调](/docs/guides/features/monorepo/sub-project-interface) 章节的例子为例，如果要发布 `apps/app` 应用项目，那么在 Monorepo 根目录下执行：

```
pnpm deploy app
```

:::info 补充信息
`app` 为应用项目的项目名称，或者说是 `package.json` 的 `name` 对应的值。
:::

执行命令之后，首先会在 Monorepo 根目录下生成 `output` 目录，其中包含了应用项目 `apps/app`、`features/internal-lib`、`packages/components`。

:::info 补充信息
`output` 目录就是需要部署到服务器上的目录，可以通过命令参数进行路径修改。可以查看 [deploy 命令](/docs/apis/commands/monorepo/deploy)。
:::

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/guides/monorepo-output.png)

然后会自动进行依赖的安装。

最后当 deploy 命令运行完成后，我们可以将 `output` 放到部署项目的服务器上。

:::tip 提示
在使用 Yarn 的 Monorepo 中，推荐全局安装 [Lerna](https://github.com/lerna/lerna) 作为 Monorepo 子项目额外的管理工具。由于 [Yarn 1 (Classic) ](https://classic.yarnpkg.com/lang/en/) 在安装依赖的时候，不会触发子项目的 [Life Cycle Scripts](https://docs.npmjs.com/cli/v7/using-npm/scripts#life-cycle-scripts)，因此还需要使用 Lerna 完成这类事情。
:::
