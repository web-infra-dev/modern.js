- **类型：** `Function | undefined`
- **默认值：** `undefined`
- **打包工具：** `仅支持 webpack`

你可以通过 `tools.webpackChain` 来修改默认的 webpack 配置，它的值为 `Function` 类型，接收两个参数：

- 第一个参数为 `webpack-chain` 对象实例，你可以通过这个实例来修改默认的 webpack 配置。
- 第二个参数为一个工具集合，包括`env`、`isProd`、`CHAIN_ID` 等。

相比于 `tools.webpack`，**webpack-chain 不仅支持链式调用，而且能够基于别名来定位到内置的 Rule 或 Plugin，从而实现精准的配置修改**。我们推荐使用 `tools.webpackChain` 来代替 `tools.webpack`。

> `tools.webpackChain` 的执行时机早于 tools.webpack，因此会被 `tools.webpack` 中的修改所覆盖。

### 工具集合

#### env

- **类型：** `'development' | 'production' | 'test'`

通过 env 参数可以判断当前环境为 development、production 还是 test。比如：

```js
export default {
  tools: {
    webpackChain: (chain, { env }) => {
      if (env === 'development') {
        chain.devtool('cheap-module-eval-source-map');
      }
    },
  },
};
```

#### isProd

- **类型：** `boolean`

通过 isProd 参数可以判断当前环境是否为 production。比如：

```js
export default {
  tools: {
    webpackChain: (chain, { isProd }) => {
      if (isProd) {
        chain.devtool('source-map');
      }
    },
  },
};
```

#### target

- **类型：** `'web' | 'node' | 'modern-web' | 'web-worker'`

通过 target 参数可以判断当前构建的目标运行时环境。比如：

```js
export default {
  tools: {
    webpackChain: (chain, { target }) => {
      if (target === 'node') {
        // ...
      }
    },
  },
};
```

#### isServer

- **类型：** `boolean`

判断当前构建的目标运行时环境是否为 `node`，等价于 `target === 'node'`。

```js
export default {
  tools: {
    webpackChain: (chain, { isServer }) => {
      if (isServer) {
        // ...
      }
    },
  },
};
```

#### isWebWorker

- **类型：** `boolean`

判断当前构建的目标运行时环境是否为 `web-worker`，等价于 `target === 'web-worker'`。

```js
export default {
  tools: {
    webpackChain: (chain, { isWebWorker }) => {
      if (isWebWorker) {
        // ...
      }
    },
  },
};
```

#### webpack

- **类型：** `typeof import('webpack')`

通过这个参数你可以拿到 webpack 实例。比如：

```js
export default {
  tools: {
    webpackChain: (chain, { webpack }) => {
      chain.plugin('my-progress').use(webpack.ProgressPlugin);
    },
  },
};
```

#### HtmlWebpackPlugin

- **类型：** `typeof import('html-webpack-plugin')`

通过这个参数你可以拿到 HtmlWebpackPlugin 实例。

```js
export default {
  tools: {
    webpackChain: (chain, { HtmlWebpackPlugin }) => {
      console.log(HtmlWebpackPlugin);
    },
  },
};
```

#### CHAIN_ID

Builder 中预先定义了一些常用的 Chain ID，你可以通过这些 ID 来定位到内置的 Rule 或 Plugin。

:::tip
请留意，下列的一部分 Rule 或 Plugin 并不是默认存在的，当你开启特定配置项、或是注册某些插件后，它们才会被包含在 webpack 配置中。

比如，`RULE.STYLUS` 仅在注册了 Stylus 插件后才会存在。
:::

#### CHAIN_ID.RULE

| ID            | 描述                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| `RULE.MJS`    | 处理 `mjs` 的规则                                                                             |
| `RULE.JS`     | 处理 `js` 的规则                                                                              |
| `RULE.TS`     | 处理 `ts` 的规则                                                                              |
| `RULE.CSS`    | 处理 `css` 的规则                                                                             |
| `RULE.LESS`   | 处理 `less` 的规则                                                                            |
| `RULE.SASS`   | 处理 `sass` 的规则                                                                            |
| `RULE.STYLUS` | 处理 `stylus` 的规则（依赖 [Stylus 插件](https://rsbuild.dev/zh/plugins/list/plugin-stylus)） |
| `RULE.SVG`    | Rule for `svg`                                                                                |
| `RULE.PUG`    | 处理 `pug` 的规则                                                                             |
| `RULE.TOML`   | 处理 `toml` 的规则                                                                            |
| `RULE.YAML`   | 处理 `yaml` 的规则                                                                            |
| `RULE.WASM`   | 处理 `wasm` 的规则                                                                            |
| `RULE.NODE`   | 处理 `node` 的规则                                                                            |
| `RULE.FONT`   | 处理字体的规则                                                                                |
| `RULE.IMAGE`  | 处理图片的规则                                                                                |
| `RULE.MEDIA`  | 处理媒体资源的规则                                                                            |

#### CHAIN_ID.ONE_OF

通过 `ONE_OF.XXX` 可以匹配到规则数组中的某一类规则。

| ID                  | 描述                                                |
| ------------------- | --------------------------------------------------- |
| `ONE_OF.SVG`        | 处理 SVG 的规则，在 data URI 和单独文件之间自动选择 |
| `ONE_OF.SVG_URL`    | 处理 SVG 的规则，输出为单独文件                     |
| `ONE_OF.SVG_INLINE` | 处理 SVG 的规则，作为 data URI 内联到 bundle 中     |
| `ONE_OF.SVG_ASSETS` | 处理 SVG 的规则，在 data URI 和单独文件之间自动选择 |

#### CHAIN_ID.USE

通过 `USE.XXX` 可以匹配到对应的 loader。

| ID                                | 描述                                  |
| --------------------------------- | ------------------------------------- |
| `USE.TS`                          | 对应 `ts-loader`                      |
| `USE.CSS`                         | 对应 `css-loader`                     |
| `USE.LESS`                        | 对应 `less-loader`                    |
| `USE.SASS`                        | 对应 `sass-loader`                    |
| `USE.STYLUS`                      | 对应 `stylus-loader`                  |
| `USE.PUG`                         | 对应 `pug-loader`                     |
| `USE.VUE`                         | 对应 `vue-loader`                     |
| `USE.TOML`                        | 对应 `toml-loader`                    |
| `USE.YAML`                        | 对应 `yaml-loader`                    |
| `USE.NODE`                        | 对应 `node-loader`                    |
| `USE.URL`                         | 对应 `url-loader`                     |
| `USE.SVGR`                        | 对应 `@svgr/webpack`                  |
| `USE.BABEL`                       | 对应 `babel-loader`                   |
| `USE.STYLE`                       | 对应 `style-loader`                   |
| `USE.POSTCSS`                     | 对应 `postcss-loader`                 |
| `USE.CSS_MODULES_TS`              | 对应 `css-modules-typescript-loader`  |
| `USE.MINI_CSS_EXTRACT`            | 对应 `mini-css-extract-plugin.loader` |
| `USE.RESOLVE_URL_LOADER_FOR_SASS` | 对应 `resolve-url-loader`             |

#### CHAIN_ID.PLUGIN

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
| `PLUGIN.MANIFEST`              | 对应 `WebpackManifestPlugin`                                                       |
| `PLUGIN.TS_CHECKER`            | 对应 `ForkTsCheckerWebpackPlugin`                                                  |
| `PLUGIN.INLINE_HTML`           | 对应 `InlineChunkHtmlPlugin`                                                       |
| `PLUGIN.BUNDLE_ANALYZER`       | 对应 `WebpackBundleAnalyzer`                                                       |
| `PLUGIN.MINI_CSS_EXTRACT`      | 对应 `MiniCssExtractPlugin`                                                        |
| `PLUGIN.VUE_LOADER_PLUGIN`     | 对应 `VueLoaderPlugin`                                                             |
| `PLUGIN.REACT_FAST_REFRESH`    | 对应 `ReactFastRefreshPlugin`                                                      |
| `PLUGIN.NODE_POLYFILL_PROVIDE` | 对应处理 node polyfill 的 `ProvidePlugin`                                          |
| `PLUGIN.SUBRESOURCE_INTEGRITY` | 对应 `webpack-subresource-integrity`                                               |
| `PLUGIN.ASSETS_RETRY`          | 对应 Builder 中的 webpack 静态资源重试插件 `WebpackAssetsRetryPlugin`              |
| `PLUGIN.AUTO_SET_ROOT_SIZE`    | 对应 Builder 中的自动设置根字体大小插件 `AutoSetRootSizePlugin`                    |

#### CHAIN_ID.MINIMIZER

通过 `MINIMIZER.XXX` 可以匹配到对应的压缩工具。

| ID                  | 描述                             |
| ------------------- | -------------------------------- |
| `MINIMIZER.JS`      | 对应 `TerserWebpackPlugin`       |
| `MINIMIZER.CSS`     | 对应 `CssMinimizerWebpackPlugin` |
| `MINIMIZER.ESBUILD` | 对应 `ESBuildPlugin`             |
| `MINIMIZER.SWC`     | 对应 `SwcWebpackPlugin`          |

### 使用示例

使用示例可参考：[WebpackChain 使用示例](https://modernjs.dev/builder/guide/advanced/custom-webpack-config.html#%E4%BD%BF%E7%94%A8-webpack-chain)。
