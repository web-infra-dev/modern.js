- Type: `Function | undefined`
- Default: `undefined`

你可以通过 `tools.webpackChain` 来修改默认的 webpack 配置，值为 `Function` 类型，接收两个参数：

- 第一个参数为 `webpack-chain` 对象实例，你可以通过这个实例来修改默认的 webpack 配置。
- 第二个参数为一个工具集合，包括`env`、`isProd`、`CHAIN_ID` 等。

相比于 `tools.webpack`，**webpack-chain 不仅支持链式调用，而且能够基于别名来定位到内置的 Rule 或 Plugin，从而实现精准的配置修改**。我们推荐使用 `tools.webpackChain` 来代替 `tools.webpack`。

> `tools.webpackChain` 的执行时机早于 tools.webpack，因此会被 `tools.webpack` 中的修改所覆盖。

### 工具集合

#### env

- Type: `'development' | 'production' | 'test'`

通过 env 参数可以判断当前环境为 development、production 还是 test。比如：

```js
export default {
  tools: {
    webpack: (config, { env }) => {
      if (env === 'development') {
        config.devtool = 'cheap-module-eval-source-map';
      }
      return config;
    },
  },
};
```

#### isProd

- Type: `boolean`

通过 isProd 参数可以判断当前环境是否为 production。比如：

```js
export default {
  tools: {
    webpack: (config, { isProd }) => {
      if (isProd) {
        config.devtool = 'source-map';
      }
      return config;
    },
  },
};
```

#### target

- Type: `'web' | 'node' | 'modern-web'`

通过 target 参数可以判断当前构建的目标运行时环境。比如：

```js
export default {
  tools: {
    webpack: (config, { target }) => {
      if (target === 'node') {
        // ...
      }
      return config;
    },
  },
};
```

#### webpack

- Type: `Object`

通过这个参数你可以拿到 webpack 实例。比如：

```js
export default {
  tools: {
    webpack: (config, { webpack }) => {
      config.plugins.push(new webpack.ProgressPlugin());
      return config;
    },
  },
};
```

#### CHAIN_ID

builder 中预先定义了一些常用的 Chain ID，你可以通过这些 ID 来定位到内置的 Rule 或 Plugin。

##### CHAIN_ID.RULE

| ID           | 描述               |
| ------------ | ------------------ |
| `RULE.MJS`   | 处理 `mjs` 的规则  |
| `RULE.JS`    | 处理 `js` 的规则   |
| `RULE.TS`    | 处理 `ts` 的规则   |
| `RULE.CSS`   | 处理 `css` 的规则  |
| `RULE.LESS`  | 处理 `less` 的规则 |
| `RULE.SASS`  | 处理 `sass` 的规则 |
| `RULE.PUG`   | 处理 `pug` 的规则  |
| `RULE.TOML`  | 处理 `toml` 的规则 |
| `RULE.YAML`  | 处理 `yaml` 的规则 |
| `RULE.FONT`  | 处理字体的规则     |
| `RULE.IMAGE` | 处理图片的规则     |
| `RULE.MEDIA` | 处理媒体资源的规则 |

### CHAIN_ID.ONE_OF

通过 `ONE_OF.XXX` 可以匹配到规则数组中的某一类规则。

| ID                  | 描述                                                |
| ------------------- | --------------------------------------------------- |
| `ONE_OF.SVG`        | 处理 SVG 的规则，在 data URI 和单独文件之间自动选择 |
| `ONE_OF.SVG_URL`    | 处理 SVG 的规则，输出为单独文件                     |
| `ONE_OF.SVG_INLINE` | 处理 SVG 的规则，作为 data URI 内联到 bundle 中     |
| `ONE_OF.SVG_ASSETS` | 处理 SVG 的规则，在 data URI 和单独文件之间自动选择 |

### CHAIN_ID.USE

通过 `USE.XXX` 可以匹配到对应的 loader。

| ID                     | 描述                                  |
| ---------------------- | ------------------------------------- |
| `USE.TS`               | 对应 `ts-loader`                      |
| `USE.CSS`              | 对应 `css-loader`                     |
| `USE.LESS`             | 对应 `less-loader`                    |
| `USE.SASS`             | 对应 `sass-loader`                    |
| `USE.PUG`              | 对应 `pug-loader`                     |
| `USE.TOML`             | 对应 `toml-loader`                    |
| `USE.YAML`             | 对应 `yaml-loader`                    |
| `USE.FILE`             | 对应 `file-loader`                    |
| `USE.URL`              | 对应 `url-loader`                     |
| `USE.SVGR`             | 对应 `@svgr/webpack`                  |
| `USE.BABEL`            | 对应 `babel-loader`                   |
| `USE.STYLE`            | 对应 `style-loader`                   |
| `USE.POSTCSS`          | 对应 `postcss-loader`                 |
| `USE.MARKDOWN`         | 对应 `markdown-loader`                |
| `USE.CSS_MODULES_TS`   | 对应 `css-modules-typescript-loader`  |
| `USE.MINI_CSS_EXTRACT` | 对应 `mini-css-extract-plugin.loader` |

### CHAIN_ID.PLUGIN

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
| `PLUGIN.INSPECTOR`             | 对应 `@modern-js/inspector-webpack-plugin`                                         |
| `PLUGIN.SUBRESOURCE_INTEGRITY` | 对应 `webpack-subresource-integrity`                                               |
| `PLUGIN.ASSETS_RETRY`          | 对应 Builder 中的 webpack 静态资源重试插件 `WebpackAssetsRetryPlugin`              |
| `AUTO_SET_ROOT_SIZE`           | 对应 Builder 中的自动设置根字体大小插件 `AutoSetRootSizePlugin`                    |

### CHAIN_ID.MINIMIZER

通过 `MINIMIZER.XXX` 可以匹配到对应的压缩工具。

| ID                  | 描述                             |
| ------------------- | -------------------------------- |
| `MINIMIZER.JS`      | 对应 `TerserWebpackPlugin`       |
| `MINIMIZER.CSS`     | 对应 `CssMinimizerWebpackPlugin` |
| `MINIMIZER.ESBUILD` | 对应 `ESBuildPlugin`             |

### 常用 WebpackChain 使用示例

以下是一些常见的配置示例，完整的 webpack-chain API 请见 [webpack-chain 文档](https://github.com/neutrinojs/webpack-chain)。

#### 新增/修改/删除 loader

```js
export default {
  tools: {
    webpackChain: chain => {
      // 新增 loader
      chain.module
        .rule('md')
        .test(/\.md$/)
        .use('md-loader')
        .loader('md-loader');
      // 修改 loader
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use(CHAIN_ID.USE.BABEL)
        .tap(options => {
          options.plugins.push('babel-plugin-xxx');
          return options;
        });
      // 删除 loader
      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
    },
  },
};
```

#### 新增/修改/删除 plugin

```js
export default {
  tools: {
    webpackChain: chain => {
      // 新增插件
      chain.plugin('define').use(webpack.DefinePlugin, [
        {
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          },
        },
      ]);
      // 修改插件
      chain.plugin(CHAIN_ID.PLUGIN.HMR).tap(options => {
        options[0].fullBuildTimeout = 200;
        return options;
      });
      // 删除插件
      chain.plugins.delete(CHAIN_ID.PLUGIN.HMR);
    },
  },
};
```
