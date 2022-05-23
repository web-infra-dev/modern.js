---
sidebar_label: esbuild
---

# tools.esbuild

:::info 适用的工程方案
MWA。
:::

- 类型： `Object`
- 默认值： `{}`

## 介绍

esbuild 是使用 Go 语言编写的 JavaScript Bundler/Minifier，它的特点是速度极快。在代码压缩方面，相比 webpack 内置的 terser 压缩器，esbuild 在性能上有数十倍的提升。

Modern.js 基于 esbuild 提供了代码压缩的能力，在大型工程中开启 `@modern-js/plugin-esbuild` 插件，**可以大幅度减少代码压缩所需的时间，同时有效避免 OOM (heap out of memory) 问题**。

使用 esbuild 压缩虽然带来了构建效率上的提升，但 esbuild 的压缩比例是低于 terser 的，因此**构建产物的体积会增大**，请根据业务情况酌情使用（比较适合中后台场景）。

对于压缩工具之间的详细对比，可以参考 [minification-benchmarks](https://github.com/privatenumber/minification-benchmarks)。

:::info
除了代码压缩外，esbuild 也可以代替 babel 进行代码编译，优点是可以提升编译速度，缺点是无法使用丰富的 babel 插件能力。

目前 `@modern-js/plugin-esbuild` 暂时未提供基于 esbuild 进行代码编译的能力，有这方面需要的话，可以使用 [esbuild-loader](https://github.com/privatenumber/esbuild-loader) 实现。
:::

## 安装

使用前需要安装 `@modern-js/plugin-esbuild` 插件，安装完成后，会自动将 JS 和 CSS 的压缩器切换为 esbuild。

```bash
pnpm add @modern-js/plugin-esbuild -D
```

## 配置项

### target

- 类型： `string | string[]`
- 默认值： `'esnext'`

为生成的 JavaScript 和 CSS 代码设置目标环境。

可以直接设置为 JavaScript 语言版本，比如 `es5`，`es6`，`es2020`。也可以设置为若干个目标环境，每个目标环境都是一个环境名称后跟一个版本号。比如 `['chrome58', 'edge16' ,'firefox57']`。

支持设置以下环境：

- chrome
- edge
- firefox
- ie
- ios
- node
- opera
- safari

默认情况下，esbuild 压缩过程中会引入 ES6 代码，比如模板字符串。如果需要兼容 ES5，可以将 `target` 设置为 `es5`。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    esbuild: {
      target: 'es5',
    },
  },
});
```

:::info
设置 `target` 为 `es5` 时，需要保证所有代码被 babel 转义为 es5 代码，否则会导致 esbuild 编译报错：`Transforming 'xxx' to the configured target environment ("es5") is not supported yet`。

`target` 字段的详细介绍可以参考 [esbuild - target](https://esbuild.github.io/api/#target)。
:::
