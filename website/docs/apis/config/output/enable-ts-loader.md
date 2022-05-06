---
sidebar_label: enableTsLoader
---

# output.enableTsLoader

:::info 适用的工程方案
MWA。
:::

- 类型： `boolean`
- 默认值： `false`

默认情况下，Modern.js 使用 Babel 编译 TS 文件，开启该选项后，会使用 [ts-loader](https://github.com/TypeStrong/ts-loader) 编译 TS 文件。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableTsLoader: true,
  },
});
```

## 详细介绍

Modern.js 基于 Babel 的 [@babel/plugin-transform-typescript](https://babeljs.io/docs/en/babel-plugin-transform-typescript) 插件对 TS 文件进行编译。

该插件的行为与 `ts-loader` 有少许不同，比如：

1. 不提供 TypeScript 类型检查（Modern.js 中默认集成了 `fork-ts-checker-webpack-plugin` 插件，提供完善的类型检查，因此这个差异可以忽略）。
2. 不支持 TypeScript 特有的 `export =` 和 `import = require()` 语法。

```js
// 以下写法无法通过 Babel 编译
const foo = '1';
export = foo;
```

:::info
关于 `@babel/plugin-transform-typescript` 与 `ts-loader` 之间的详细差异，可以阅读 [Caveats](https://babeljs.io/docs/en/babel-plugin-transform-typescript#caveats)。
:::

## 使用场景

如果你的项目中遇到了 Babel 编译 TS 文件的问题，建议优先考虑修改相关语法，使之能通过编译。

在无法修改语法的前提下，可以考虑开启 `output.enableTsLoader` 选项，引入 `ts-loader` 编译。由于 `ts-loader` 需要进行额外的语法解析和类型检查，因此会**导致项目编译速度变慢**，请权衡使用。
