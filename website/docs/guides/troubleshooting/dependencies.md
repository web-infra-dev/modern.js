---
sidebar_position: 1
---

# 依赖安装问题

### 如何升级项目中的 Modern.js 到最新版本？

对于使用 yarn 的项目，可以执行：

```bash
yarn upgrade --scope @modern-js
```

对于使用 pnpm 的项目，可以执行：

```bash
pnpm update "@modern-js/*" -r
```

如果需要了解不同版本之间的更新内容，可以查看：

- Modern.js 发版日志：[Modern.js/releases](https://github.com/modern-js-dev/modern.js/releases)。
- 各个 package 下的 `CHANGELOG.md` 文件。

### 安装依赖时提示 The engine "node" is incompatible？

安装依赖时如果出现以下报错提示，说明当前环境使用的 Node.js 版本过低，需要升级 Node.js 到更高版本。

```bash
The engine "node" is incompatible with this module.

Expected version ">=14.17.6". Got "12.20.1"
```

使用 Modern.js 时，建议使用 [Node.js 14.x](https://nodejs.org/download/release/latest-v14.x/) 或 [Node.js 16.x](https://nodejs.org/download/release/latest-v16.x/) 的最新版本。

如果当前环境的 Node.js 版本低于上述要求的版本，则可以使用 [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm) 等工具进行版本切换。

下面是使用 nvm 的示例：

```
# 安装 Node.js v14
nvm install 14

# 切换到 Node 14
nvm use 14

# 将 Node 14 设置为默认版本
nvm default 14
```

在本地开发环境推荐使用 [fnm](https://github.com/Schniz/fnm)，它的用法与 nvm 相似，但拥有比 nvm 更好的性能。
