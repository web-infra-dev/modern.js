- **Type:** `Function | undefined`
- **Default:** `undefined`
- **Bundler:** `only support webpack`

You can modify the webpack configuration by configuring `tools.webpackChain` which is type of `Function`. The function receives two parameters, the first is the original webpack chain object, and the second is an object containing some utils.

Compared with `tools.webpack`, **webpack-chain not only supports chained calls, but also can locate built-in Rule or Plugin based on aliases, so as to achieve precise config modification**. We recommend using `tools.webpackChain` instead of `tools.webpack`.

> `tools.webpackChain` is executed earlier than tools.webpack and thus will be overridden by changes in `tools.webpack`.

### Utils

#### env

- **Type:** `'development' | 'production' | 'test'`

The `env` parameter can be used to determine whether the current environment is development, production or test. For example:

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

- **Type:** `boolean`

The `isProd` parameter can be used to determine whether the current environment is production. For example:

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

- **Type:** `'web' | 'node' | 'modern-web' | 'web-worker'`

The `target` parameter can be used to determine the current environment. For example:

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

- **Type:** `boolean`

Determines whether the target environment is `node`, equivalent to `target === 'node'`.

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

- **Type:** `boolean`

Determines whether the target environment is `web-worker`, equivalent to `target === 'web-worker'`.

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

- **Type:** `typeof import('webpack')`

The webpack instance. For example:

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

- **Type:** `typeof import('html-webpack-plugin')`

The HtmlWebpackPlugin instance:

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

Some common Chain IDs are predefined in the Builder, and you can use these IDs to locate the built-in Rule or Plugin.

:::tip
Please note that some of the rules or plugins listed below are not available by default. They will only be included in the webpack configuration when you enable specific options or register certain plugins.

For example, the `RULE.STYLUS` rule exists only when the Stylus plugin is registered.
:::

#### CHAIN_ID.RULE

| ID            | Description                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| `RULE.JS`     | Rule for `js`                                                                               |
| `RULE.TS`     | Rule for `ts`                                                                               |
| `RULE.CSS`    | Rule for `css`                                                                              |
| `RULE.LESS`   | Rule for `less`                                                                             |
| `RULE.SASS`   | Rule for `sass`                                                                             |
| `RULE.STYLUS` | Rule for `stylus`(requires [Stylus plugin](https://rsbuild.dev/plugins/list/plugin-stylus)) |
| `RULE.SVG`    | Rule for `svg`                                                                              |
| `RULE.PUG`    | Rule for `pug`                                                                              |
| `RULE.TOML`   | Rule for `toml`                                                                             |
| `RULE.YAML`   | Rule for `yaml`                                                                             |
| `RULE.WASM`   | Rule for `WASM`                                                                             |
| `RULE.NODE`   | Rule for `node`                                                                             |
| `RULE.FONT`   | Rule for `font`                                                                             |
| `RULE.IMAGE`  | Rule for `image`                                                                            |
| `RULE.MEDIA`  | Rule for `media`                                                                            |

#### CHAIN_ID.ONE_OF

`ONE_OF.XXX` can match a certain type of rule in the rule array.

| ID                  | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `ONE_OF.SVG`        | Rules for SVG, automatic choice between data URI and separate file |
| `ONE_OF.SVG_URL`    | Rules for SVG, output as a separate file                           |
| `ONE_OF.SVG_INLINE` | Rules for SVG, inlined into bundles as data URIs                   |
| `ONE_OF.SVG_ASSETS` | Rules for SVG, automatic choice between data URI and separate file |

#### CHAIN_ID.USE

`USE.XXX` can match a certain loader.

| ID                                | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `USE.TS`                          | correspond to `ts-loader`                      |
| `USE.CSS`                         | correspond to `css-loader`                     |
| `USE.LESS`                        | correspond to `less-loader`                    |
| `USE.SASS`                        | correspond to `sass-loader`                    |
| `USE.STYLUS`                      | correspond to `stylus-loader`                  |
| `USE.PUG`                         | correspond to `pug-loader`                     |
| `USE.VUE`                         | correspond to `vue-loader`                     |
| `USE.TOML`                        | correspond to `toml-loader`                    |
| `USE.YAML`                        | correspond to `yaml-loader`                    |
| `USE.NODE`                        | correspond to `node-loader`                    |
| `USE.URL`                         | correspond to `url-loader`                     |
| `USE.SVGR`                        | correspond to `@svgr/webpack`                  |
| `USE.BABEL`                       | correspond to `babel-loader`                   |
| `USE.STYLE`                       | correspond to `style-loader`                   |
| `USE.POSTCSS`                     | correspond to `postcss-loader`                 |
| `USE.CSS_MODULES_TS`              | correspond to `css-modules-typescript-loader`  |
| `USE.MINI_CSS_EXTRACT`            | correspond to `mini-css-extract-plugin.loader` |
| `USE.RESOLVE_URL_LOADER_FOR_SASS` | correspond to `resolve-url-loader`             |

#### CHAIN_ID.PLUGIN

`PLUGIN.XXX` can match a certain webpack plugin.

| ID                             | Description                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `PLUGIN.HMR`                   | correspond to `HotModuleReplacementPlugin`                                                                     |
| `PLUGIN.COPY`                  | correspond to `CopyWebpackPlugin`                                                                              |
| `PLUGIN.HTML`                  | correspond to `HtmlWebpackPlugin`, you need to splice the entry name when using: `${PLUGIN.HTML}-${entryName}` |
| `PLUGIN.DEFINE`                | correspond to `DefinePlugin`                                                                                   |
| `PLUGIN.IGNORE`                | correspond to `IgnorePlugin`                                                                                   |
| `PLUGIN.BANNER`                | correspond to `BannerPlugin`                                                                                   |
| `PLUGIN.PROGRESS`              | correspond to `Webpackbar`                                                                                     |
| `PLUGIN.APP_ICON`              | correspond to `AppIconPlugin`                                                                                  |
| `PLUGIN.MANIFEST`              | correspond to `WebpackManifestPlugin`                                                                          |
| `PLUGIN.TS_CHECKER`            | correspond to `ForkTsCheckerWebpackPlugin`                                                                     |
| `PLUGIN.INLINE_HTML`           | correspond to `InlineChunkHtmlPlugin`                                                                          |
| `PLUGIN.BUNDLE_ANALYZER`       | correspond to `WebpackBundleAnalyzer`                                                                          |
| `PLUGIN.MINI_CSS_EXTRACT`      | correspond to `MiniCssExtractPlugin`                                                                           |
| `PLUGIN.VUE_LOADER_PLUGIN`     | correspond to `VueLoaderPlugin`                                                                                |
| `PLUGIN.REACT_FAST_REFRESH`    | correspond to `ReactFastRefreshPlugin`                                                                         |
| `PLUGIN.NODE_POLYFILL_PROVIDE` | correspond to `ProvidePlugin` for node polyfills                                                               |
| `PLUGIN.SUBRESOURCE_INTEGRITY` | correspond to `webpack-subresource-integrity`                                                                  |
| `PLUGIN.ASSETS_RETRY`          | correspond to webpack static asset retry plugin in Builder                                                     |
| `PLUGIN.AUTO_SET_ROOT_SIZE`    | correspond to automatically set root font size plugin in Builder                                               |

#### CHAIN_ID.MINIMIZER

`MINIMIZER.XXX` can match a certain minimizer.

| ID                  | Description                               |
| ------------------- | ----------------------------------------- |
| `MINIMIZER.JS`      | correspond to `TerserWebpackPlugin`       |
| `MINIMIZER.CSS`     | correspond to `CssMinimizerWebpackPlugin` |
| `MINIMIZER.ESBUILD` | correspond to `ESBuildPlugin`             |
| `MINIMIZER.SWC`     | correspond to `SwcWebpackPlugin`          |

### Examples

For usage examples, please refer to: [WebpackChain usage examples](https://modernjs.dev/builder/en/guide/advanced/custom-webpack-config.html#webpack-chain-basics).
