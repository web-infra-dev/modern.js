# Esbuild 插件

:::tip esbuild 介绍
[esbuild](https://esbuild.github.io/) 是一款基于 Golang 开发的前端构建工具，具有打包、编译和压缩 JavaScript 代码的功能，相比传统的打包编译工具，esbuild 在性能上有显著提升。在代码压缩方面，相比 webpack 内置的 terser 压缩器，esbuild 在性能上有数十倍的提升。
:::

Builder 提供了 esbuild 插件，让你能使用 esbuild 代替 babel-loader、ts-loader 和 terser 等库进行代码编译和压缩。

## 安装插件

你可以通过如下的命令安装插件:

```bash
# npm
npm install @modern-js/builder-plugin-esbuild -D

# yarn
yarn add @modern-js/builder-plugin-esbuild -D

# pnpm
pnpm install @modern-js/builder-plugin-esbuild -D
```

## 注册插件

你可以在 Builder 中注册插件来启用 esbuild 相关功能:

```js
import { PluginEsbuild } from '@modern-js/builder-plugin-esbuild';

// 往 builder 实例上添加插件
builder.addPlugins([PluginEsbuild()]);
```

## 配置插件

插件的默认配置如下:

```ts
const defaultOptions = {
  loader: {
    target: 'es2015',
    charset: builderConfig.output.charset,
  },
  minimize: {
    css: true,
    target: 'es2015',
  },
};
```

即自动开启 JS(X)/TS(X) 和代码压缩的功能。当然，你也可以通过配置来自定义插件的行为。

### loader

- **Type**:

```ts
type LoaderOptions = EsbuildLoaderOptions | false | undefined;
```

- **Default**:

```ts
const defaultOptions = {
  target: 'es2015',
  charset: builderConfig.output.charset,
};
```

这个选项用于启用 JavaScript 和 TypeScript 的转译，启用时将会使用 esbuild-loader 替换 babel-loader 和 ts-loader。

如果你需要修改转译参数，可以查看 [esbuild-loader 文档](https://github.com/privatenumber/esbuild-loader#loader)。

### minimize

- **Type**:

```ts
type MinimizeOptions = EsbuildMinifyOptions | false | undefined;
```

- **Default**:

```ts
const defaultOptions = {
  css: true,
  target: 'es2015',
};
```

这个选项用于启用 JavaScript 和 CSS 的代码压缩。

如果你需要修改压缩参数，可以查看 [esbuild-loader 文档](https://github.com/privatenumber/esbuild-loader#minifyplugin)。

## esbuild 局限性

虽然 esbuild 能给现有的 webpack 项目带来明显的构建性能提升，但这个工具在接入 Builder 时还存在一定的局限性，需要大家在接入的时候格外注意。

### 兼容性

作为代码转译工具（即 `loader` 能力），esbuild 仅能支持到 ES2015（即 ES6）语法，如果生产环境需要降级到 ES5 及以下的语法，**请在生产环境关闭 esbuild**。

作为代码压缩工具（即 `minimize` 能力），esbuild 可以在生产环境中进行压缩和混淆，但也仅能支持 ES2015 及以上的语法(因为压缩过程需要识别代码 AST 并进行语法转换)。你可以通过如下的配置指定目标语法版本:

```ts
builder.addPlugins([
  PluginEsbuild({
    minimize: {
      target: 'es2015',
    },
  }),
]);
```

:::danger 注意
生产环境需要兼容 ES5 及以下语法的项目，请谨慎开启 minimize 能力。
:::

### 不支持 Babel 插件

作为代码转译工具时，由于 Builder 底层使用的是 esbuild 的 `Transform API`，并不支持 esbuild 插件来进行自定义编译过程，因此，诸如 `babel-plugin-import` 等原有 Babel 插件的语法编译功能在开启 esbuild 后无法使用。

### 产物体积

使用 esbuild 压缩虽然带来了构建效率上的提升，但 esbuild 的压缩比例是低于 terser 的，因此**构建产物的体积会增大**，请根据业务情况酌情使用。通常来说，esbuild 比较适合中后台等对体积不敏感的场景。

对于压缩工具之间的详细对比，可以参考 [minification-benchmarks](https://github.com/privatenumber/minification-benchmarks)。
