---
sidebar_position: 1
---

# 编译构建问题

### 如何配置 Webpack/Babel/PostCSS 等工具？

请参考 [配置底层工具](/docs/guides/usages/low-level)。

### 如何提升编译构建速度？

请参考 [提升编译速度](/docs/guides/usages/compile-speed)。

### 打包时出现 JavaScript heap out of memory?

该报错表示打包过程中出现了内存溢出问题，大多数情况下是由于打包的内容较多，超出了 Node.js 默认的内存上限。

如果出现 OOM 问题，最简单的方法是通过增加内存上限来解决，Node.js 提供了 `--max-old-space-size` 选项来对此进行设置。你可以在 `modern build` 命令前添加 NODE_OPTIONS 来设置此参数：

```bash
NODE_OPTIONS=--max_old_space_size=16384 modern build
```

参数的值代表内存上限大小（MB)，一般情况下设置为 `16384`（16GB）即可。

Node.js 官方文档中有对以下参数更详细的解释：

- [NODE_OPTIONS](http://nodejs.cn/api/cli/node_options_options.html)
- [--max-old-space-size](http://nodejs.cn/api/cli/max_old_space_size_size_in_megabytes.html)

除了增加内存上限，通过开启一些编译策略来提升效率也是一个解决方案，详见 [提升编译速度](/docs/guides/usages/compile-speed)。

### webpack 编译出现 'compilation' argument 报错

如果编译时出现以下报错，通常是由于项目中安装了错误的 webpack 版本，或者安装了多个 webpack 版本引起：

```bash
TypeError: The 'compilation' argument must be an instance of Compilation
```

webpack 版本问题有以下几种情况：

1. 项目的 package.json 中直接声明了 webpack 依赖，并且与 Modern.js 依赖的 webpack 版本范围不同，无法匹配到同一个版本。
2. 项目里安装的多个 npm 包都依赖了 webpack，并且它们依赖的 webpack 版本范围不同，无法匹配到同一个版本。
3. 由于包管理器的 lock 机制，导致 lock 文件中产生了多个 webpack 版本。

如果是第一种情况，建议从项目的 package.json 中移除 webpack 依赖。因为 Modern.js 默认封装了 webpack 相关能力，并且会在 `tools.webpack` 配置项中传入 webpack 对象。因此在大多数情况下，不建议在项目中额外安装 webpack 依赖。

如果是第二种情况，建议看看能否升级某个 npm 包，使其依赖的 webpack 版本范围与 Modern.js 保持一致。也可以通过包管理器的能力来手动统一版本，比如使用 [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) 或 [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides)。

如果是第三种情况，可以使用第二种情况中提到的两种方法，也可以尝试删除 lock 文件后重新安装来解决。

:::info
删除 lock 文件会使项目中的依赖版本自动升级到指定范围下的最新版，请进行充分的测试。
:::
