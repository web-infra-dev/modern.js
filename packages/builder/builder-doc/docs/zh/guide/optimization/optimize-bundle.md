# 产物体积优化

产物体积的优化在生产环境中是非常重要的，因为它直接影响到了线上的用户体验。在这篇文档中，我们将介绍在 Builder 中一些常见的产物体积优化方式。

## 减少重复依赖

在业务项目中，会存在某些第三方依赖被安装了多个版本的现象。重复依赖会导致包体积变大、构建速度变慢。

我们可以通过社区中的一些工具来检测或消除重复依赖。

如果你在使用 `pnpm`，可以使用 [pnpm-deduplicate](https://github.com/ocavue/pnpm-deduplicate) 来分析出所有的重复依赖，并通过升级依赖或声明 [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides) 进行版本合并。

```bash
npx pnpm-deduplicate --list
```

如果你在使用 `yarn`，可以使用 [yarn-deduplicate](https://github.com/scinos/yarn-deduplicate) 来自动合并重复依赖：

```bash
npx yarn-deduplicate && yarn
```

## 使用更轻量的库

建议将项目中体积较大的三方库替换为更轻量的库，比如将 [moment](https://momentjs.com/) 替换为 [day.js](https://day.js.org/)。

如果你需要找出项目中体积较大的三方库，可以在执行构建时添加 [BUNDLE_ANALYZE=true](/api/config-performance.html#performance-bundleanalyze) 环境变量：

```bash
BUNDLE_ANALYZE=true pnpm build
```

添加该参数后，Builder 会生成一个分析构建产物体积的 HTML 文件，手动在浏览器中打开该文件，可以看到打包产物的瓦片图。区块的面积越大，说明该模块的体积越大。

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png)

## 提升 Browserslist 范围

Builder 会根据项目的 Browserslist 配置范围进行代码编译，并注入相应的 Polyfill。如果项目不需要兼容旧版浏览器，可以根据实际情况来提升 Browserslist 范围，从而减少在语法和 Polyfill 上的编译开销。

Builder 默认的 Browserslist 配置为：

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

比如只兼容 Chrome 61 以上的浏览器，可以改成：

```js
['Chrome >= 61'];
```

:::tip
请阅读 [设置浏览器范围](/guide/advanced/browserslist.html) 章节来了解更多关于 Browserslist 的用法。
:::

## 按需引入 polyfill

在明确第三方依赖不需要额外 polyfill 的情况下，你可以将 [output.polyfill](/api/config-output.html#output-polyfill) 设置为 `usage`。

在 `usage` 模式下，Builder 会分析源代码中使用的语法，按需注入所需的 polyfill 代码，从而减少 polyfill 的代码量。

```js
export default {
  output: {
    polyfill: 'usage',
  },
};
```

:::tip
请阅读 [浏览器兼容性](/guide/advanced/browser-compatibility.html) 章节来了解更多关于 polyfill 的用法。
:::

## 使用图片压缩

在一般的前端项目中，图片资源的体积往往是项目产物体积的大头，因此如果能尽可能精简图片的体积，那么将会对项目的打包产物体积起到明显的优化效果。你可以在 Builder 中注册插件来启用图片压缩功能:

```js
import { PluginImageCompress } from '@modern-js/builder-plugin-image-compress';

// 往 builder 实例上添加插件
builder.addPlugins([PluginImageCompress()]);
```

详见 [Image Compress 插件](/plugins/plugin-image-compress)。

## 代码拆包

良好的拆包策略对于提升应用的加载性能是十分重要的，可以充分利用浏览器的缓存机制，减少请求数量，加快页面加载速度。

在 Builder 中内置了[多种拆包策略](/guide/optimization/split-chunk)，可以满足大部分应用的需求，你也可以根据自己的业务场景，自定义拆包配置，比如下面的配置:

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      forceSplitting: {
        // 比如将 react-query 包拆分为一个 Chunk
        react_query: [/node_modules\/react-query/],
      },
    },
  },
};
```
