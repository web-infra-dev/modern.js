# ESBuild 插件

> ESBuild 是一款基于 Golang 开发的前端构建工具，具有打包、编译和压缩 JavaScript 代码的功能，相比传统的打包编译工具性能提升 10~100 倍。

Builder 提供了 ESBuild 接入插件，让你能使用 ESBuild 代替 babel-loader、ts-loader 和 terser 等库进行代码编译和压缩。

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

你可以在 Builder 中注册插件，以便 Builder 接入 ESBuild 的功能:

```js
import { PluginEsbuild } from '@modern-js/builder-plugin-esbuild';

// 往 builder 实例上添加插件
builder.addPlugins([PluginEsbuild()]);
```

## 配置插件

插件的默认配置如下:

```js
{
  loader: {},
  minimize: {},
}
```

即自动开启 JS(X)/TS(X) 和代码压缩的功能。当然，你也可以通过配置来自定义插件的行为。

### loader

- **Type**: `undefined | false | ` { javascript?: boolean | [LoaderOptions](https://github.com/privatenumber/esbuild-loader#loader); typescript?: boolean | [LoaderOptions](https://github.com/privatenumber/esbuild-loader#loader); }
- **Default**: `{}`

这个选项用于启用 JavaScript/TypeScript 的转译，启用时将会使用 esbuild-loader 替换 babel-loader 和 ts-loader。JavaScript 和 TypeScript 的转译可以分开控制。

### minimize

- **Type**: `undefined | false | ` [MinifyPlugin.Options](https://github.com/privatenumber/esbuild-loader#minifyplugin)
- **Default**: `true`

当设置为 `true` 时，将应用默认配置，默认配置为：

```typescript
const DEFAULT_MINIFY_OPTIONS = {
  target: 'es2015',
};
```

如果你需要修改压缩参数，可以查看[官方文档](https://github.com/privatenumber/esbuild-loader#minifyplugin)。

## 限制条件

虽然 ESBuild 能给现有的 webpack 项目带来明显的构建性能提升，但这两个工具在接入 Builder 时还存在一定的局限性，需要大家在接入的时候格外注意。

### ESBuild 限制

作为代码转译工具(即 `loader` 能力)，ESBuild 仅能支持到 ES2015(即 ES6) 语法，如果生产环境需要降级到 ES5 及以下的语法，**请在生产环境关闭 ESBuild**。另外，由于 Eden 底层使用的是 ESBuild 的`Transform API`，并不支持 ESBuild 插件来进行自定义编译过程，因此，诸如 `babel-plugin-import` 等原有 Babel 插件的语法编译功能在开启 ESBuild 后无法使用！

作为代码压缩工具(即 `minimize` 能力)，ESBuild 可以在生产环境中进行压缩和混淆，但也仅能支持 ES2015 即以上的语法(因为压缩过程需要识别代码 AST 并进行语法转换)。你可以通过如下的配置指定目标语法版本:

```ts
builder.addPlugins([PluginEsbuild({
  minimize: {
    target: 'es2015',
  },
})]);
```

:::danger 注意
生产环境需要兼容 ES5 及以下语法的项目需要谨慎开启 minimize 能力!
:::
