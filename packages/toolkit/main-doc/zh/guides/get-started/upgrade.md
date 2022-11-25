---
title: 升级
sidebar_position: 2
---

## 通过命令行升级

Modern.js 提供了 `upgrade` 命令支持项目升级到最新的 Modern.js 版本。

在项目中执行 `pnpm run upgrade`：

```bash
$ pnpm run upgrade

> modern upgrade

[INFO] [项目类型]: 应用
[INFO] [Modern.js 最新版本]: 2.0.0
[INFO] [当前项目 Modern.js 依赖已经为最新版本]: 2.0.0
```

可以看到项目 `package.json` 中的依赖已经更改到最新，执行 `pnpm install` 重新安装即可。

## 指定版本升级

Modern.js 所有的官方包目前都使用统一版本号进行发布。

根据官网 Release Note，开发者也可以手动将项目升级到想要的版本。

:::tip
对所有 Modern.js 官方提供的包做统一升级，而不是升级单个依赖。
:::

## 锁定子依赖

当项目某个子依赖出现问题，而 Modern.js 无法立即更新时，可以使用包管理器锁定子依赖版本。

### Pnpm

对于使用 Pnpm 的项目，请在**项目根目录**的 `package.json` 中添加以下配置，然后重新执行 `pnpm i`：

```json
{
  "pnpm": {
    "overrides": {
      "package-name": "^1.0.0"
    }
  }
}
```

### Yarn

对于使用 Yarn 的项目，请在**项目根目录**的 `package.json` 中添加以下配置，然后重新执行 `yarn i`：

```json
{
  "resolutions": {
    "package-name": "^1.0.0"
  }
}
```

### Npm

对于使用 Npm 的项目，请在**项目根目录**的 `package.json` 中添加以下配置，然后重新执行 `npm i`：

```json
{
  "overrides": {
    "package-name": "^1.0.0"
  }
}
```

:::info
对于 Monorepo 仓库，只能在项目根目录的 `package.json` 中锁定依赖版本，并且会影响 Monorepo 中的所有 package。
:::
