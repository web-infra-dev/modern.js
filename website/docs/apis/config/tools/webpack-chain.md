---
sidebar_label: webpackChain
---

# tools.webpackChain

:::info 适用的工程方案
MWA。
:::

- 类型： `(chain, { env, name, webpack, CHAIN_ID }) => void`
- 默认值： `undefined`

通过 [webpack-chain](https://github.com/neutrinojs/webpack-chain) 来修改默认的 webpack 配置，值为 `Function` 类型。

- 函数的第一个参数为 `webpack-chain` 对象。
- 函数的第二个参数为一些工具集合，包括 `env`、`name`、`webpack` `CHAIN_ID` 等。

相比于 `tools.webpack`，**webpack-chain 不仅支持链式调用，而且能够基于别名来定位到内置的 Rule 或 Plugin，从而实现精准的配置修改。**我们推荐使用 `tools.webpackChain` 来代替 `tools.webpack`。

:::info 执行时机
`tools.webpackChain` 的执行时机早于 `tools.webpack`，因此会被 `tools.webpack` 中的修改所覆盖。
:::

## 示例

以下是一些常见用法的示例，完整 API 请参考 [webpack-chain 文档](https://github.com/neutrinojs/webpack-chain)。

### 新增 loader

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: chain => {
      chain.module
        .rule('compile-svg')
        .test(/\.svg$/)
        .use('svg-inline')
        .loader('svg-inline-loader');
    },
  },
});
```

### 新增 plugin

```js title="modern.config.js"
import CleanPlugin from 'clean-webpack-plugin';

export default defineConfig({
  tools: {
    webpackChain: chain => {
      chain.plugin('clean').use(CleanPlugin, [['dist'], { root: '/dir' }]);
    },
  },
});
```

### 判断环境

通过 `env` 参数可以判断当前环境为 `development` 还是 `production`：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { env }) => {
      console.log(env); // => development
    },
  },
});
```

### 判断构建产物的运行环境

通过 `name` 参数可以判断当前构建产物的运行环境：

- `client`: 默认值，构建产物为运行在浏览器端的代码。
- `server`: 开启 [server.ssr](/docs/apis/config/server/ssr) SSR 后，构建产物为针对 SSR 场景的代码。
- `modern`: 开启 [output.enableModernMode](docs/apis/config/output/enable-modern-mode) 后，构建产物为运行在现代浏览器上的代码。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (config, { name }) => {
      if (name === 'server') {
        // 针对 SSR 场景添加配置
      }
    },
  },
});
```

### webpack 对象

通过 `webpack` 参数可以获取 Modern.js 内部使用的 webpack 对象。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { webpack }) => {
      console.log(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      );
    },
  },
});
```

建议优先使用该参数来访问 webpack 对象，而不是通过 import 来引入 `webpack`。

如果需要通过 import 引入，则项目里需要单独安装 webpack 依赖，这样可能会导致 webpack 被重复安装，因此不推荐该做法。

```js title="modern.config.js"
import webpack from 'webpack';

export default defineConfig({
  tools: {
    webpackChain: chain => {
      console.log(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      );
    },
  },
});
```

## 预设 ID 用法

Modern.js 中预先定义了大量的 plugins 和 loaders，通过常量 `CHAIN_ID` 可以读取到这些预设内容的 ID，便于进行修改。

下面是一些修改的示例：

### 修改 MiniCssExtractPlugin

通过 `CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT` 可以读取到 `MiniCssExtractPlugin`，然后通过 `tap` 方法进行修改：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { CHAIN_ID }) => {
      chain.plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT).tap(options => ({
        ...options,
        ignoreOrder: false,
      }));
    },
  },
});
```

### 修改 HtmlWebpackPlugin

通过 `CHAIN_ID.PLUGIN.HTML` 可以读取到 `HtmlWebpackPlugin`。

由于 Modern.js 会为每个入口文件注册一个 `HtmlWebpackPlugin`，因此在修改插件时，需要基于 `${CHAIN_ID.PLUGIN.HTML}-${entry}` 来进行定位。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { CHAIN_ID }) => {
      const entries = Object.keys(chain.entryPoints.entries());

      entries.forEach(entry => {
        chain.plugin(`${CHAIN_ID.PLUGIN.HTML}-${entry}`).tap(options => ({
          ...options,
          inject: 'body',
        }));
      });
    },
  },
});
```

### 修改 css-loader

通过 `CHAIN_ID.USE.CSS` 可以读取到 `css-loader`，然后通过 `tap` 方法进行修改：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.LOADERS)
        .oneOf(CHAIN_ID.ONE_OF.CSS)
        .use(CHAIN_ID.USE.CSS)
        .tap(options => ({
          ...options,
          sourceMap: false,
        }));
    },
  },
});
```

### 修改 babel-loader

通过 `CHAIN_ID.USE.BABEL` 可以读取到 `babel-loader`，然后通过 `tap` 方法进行修改：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.LOADERS)
        .oneOf(CHAIN_ID.ONE_OF.JS)
        .use(CHAIN_ID.USE.BABEL)
        .tap(options => ({
          ...options,
          plugins: [...babelOptions.plugins, require.resolve('my-plugin')],
        }));
    },
  },
});
```

## 预设 ID 列表

下面是完整的预设 ID 列表：

### RULE

| ID             | 描述                         |
| -------------- | ---------------------------- |
| `RULE.LOADERS` | Modern.js 预设的所有 Loaders |

### ONE_OF

通过 `ONE_OF.XXX` 可以匹配到规则数组中的某一类规则。

| ID                     | 描述                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `ONE_OF.JS`            | 处理 JS 的规则，未开启 `ts-loader` 时，也会处理 TS 文件        |
| `ONE_OF.TS`            | 处理 TS 的规则，仅在开启 `ts-loader` 时生效                    |
| `ONE_OF.CSS`           | 处理 CSS 的规则                                                |
| `ONE_OF.CSS_MODULES`   | 处理 CSS Modules 的规则                                        |
| `ONE_OF.LESS`          | 处理 LESS 的规则                                               |
| `ONE_OF.LESS_MODULES`  | 处理 LESS Modules 的规则                                       |
| `ONE_OF.SASS`          | 处理 SASS 的规则                                               |
| `ONE_OF.SASS_MODULES`  | 处理 SASS Modules 的规则                                       |
| `ONE_OF.YAML`          | 处理 `.yaml` 文件的规则                                        |
| `ONE_OF.TOML`          | 处理 `.toml` 文件的规则                                        |
| `ONE_OF.MARKDOWN`      | 处理 Markdown 的规则                                           |
| `ONE_OF.SVG`           | 处理 SVG 的规则，在 data URI 和单独文件之间自动选择            |
| `ONE_OF.SVG_URL`       | 处理 SVG 的规则，输出为单独文件                                |
| `ONE_OF.SVG_INLINE`    | 处理 SVG 的规则，作为 data URI 内联到 bundle 中                |
| `ONE_OF.ASSETS`        | 处理图片、字体等资源的规则，在 data URI 和单独文件之间自动选择 |
| `ONE_OF.ASSETS_URL`    | 处理图片、字体等资源的规则，输出为单独文件                     |
| `ONE_OF.ASSETS_INLINE` | 处理图片、字体等资源的规则，作为 data URI 内联到 bundle 中     |
| `ONE_OF.FALLBACK`      | 处理无法识别的文件类型，通过 `file-loader` 输出为文件          |

### USE

通过 `USE.XXX` 可以匹配到对应的 loader。

| ID                     | 描述                                  |
| ---------------------- | ------------------------------------- |
| `USE.TS`               | 对应 `ts-loader`                      |
| `USE.CSS`              | 对应 `css-loader`                     |
| `USE.URL`              | 对应 `url-loader`                     |
| `USE.FILE`             | 对应 `file-loader`                    |
| `USE.SVGR`             | 对应 `@svgr/webpack`                  |
| `USE.YAML`             | 对应 `yaml-loader`                    |
| `USE.TOML`             | 对应 `toml-loader`                    |
| `USE.HTML`             | 对应 `html-loader`                    |
| `USE.BABEL`            | 对应 `babel-loader`                   |
| `USE.STYLE`            | 对应 `style-loader`                   |
| `USE.POSTCSS`          | 对应 `postcss-loader`                 |
| `USE.MARKDOWN`         | 对应 `markdown-loader`                |
| `USE.CSS_MODULES_TS`   | 对应 `css-modules-typescript-loader`  |
| `USE.MINI_CSS_EXTRACT` | 对应 `mini-css-extract-plugin.loader` |

### PLUGIN

通过 `PLUGIN.XXX` 可以匹配到对应的 plugin。

| ID                             | 描述                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `PLUGIN.HMR`                   | 对应 `HotModuleReplacementPlugin`                                                  |
| `PLUGIN.COPY`                  | 对应 `CopyWebpackPlugin`                                                           |
| `PLUGIN.HTML`                  | 对应 `HtmlWebpackPlugin`，使用时需要拼接 entry 名称：`${PLUGIN.HTML}-${entryName}` |
| `PLUGIN.DEFINE`                | 对应 `DefinePlugin`                                                                |
| `PLUGIN.IGNORE`                | 对应 `IgnorePlugin`                                                                |
| `PLUGIN.BANNER`                | 对应 `BannerPlugin`                                                                |
| `PLUGIN.PROGRESS`              | 对应 `Webpackbar`                                                                  |
| `PLUGIN.APP_ICON`              | 对应 `AppIconPlugin`                                                               |
| `PLUGIN.LOADABLE`              | 对应 `LoadableWebpackPlugin`                                                       |
| `PLUGIN.MANIFEST`              | 对应 `WebpackManifestPlugin`                                                       |
| `PLUGIN.TS_CHECKER`            | 对应 `ForkTsCheckerWebpackPlugin`                                                  |
| `PLUGIN.INLINE_HTML`           | 对应 `InlineChunkHtmlPlugin`                                                       |
| `PLUGIN.BUNDLE_ANALYZER`       | 对应 `WebpackBundleAnalyzer`                                                       |
| `PLUGIN.BOTTOM_TEMPLATE`       | 对应 `BottomTemplatePlugin`                                                        |
| `PLUGIN.MINI_CSS_EXTRACT`      | 对应 `MiniCssExtractPlugin`                                                        |
| `PLUGIN.REACT_FAST_REFRESH`    | 对应 `ReactFastRefreshPlugin`                                                      |
| `PLUGIN.NODE_POLYFILL_PROVIDE` | 对应处理 node polyfill 的 `ProvidePlugin`                                          |

### MINIMIZER

通过 `MINIMIZER.XXX` 可以匹配到对应的压缩工具。

| ID                  | 描述                             |
| ------------------- | -------------------------------- |
| `MINIMIZER.JS`      | 对应 `TerserWebpackPlugin`       |
| `MINIMIZER.CSS`     | 对应 `CssMinimizerWebpackPlugin` |
| `MINIMIZER.ESBUILD` | 对应 `ESBuildPlugin`             |

## 常见问题

### 如何查看最终生效的 webpack 配置？

可以通过 [modern inspect](/docs/apis/commands/mwa/inspect) 命令来查看最终生效的 webpack 配置，从而确定 `tools.webpackChain` 的改动是否正确应用到 webpack 配置上。
