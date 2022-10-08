- Type: `Function | undefined`
- Default: `undefined`

You can modify the webpack configuration by configuring `tools.webpackChain` which is type of `Function`.The function receives two parameters, the first is the original webpack chain object, and the second is an object containing some information about the toolset.

Compared with `tools.webpack`, **webpack-chain not only supports chained calls, but also can locate built-in Rule or Plugin based on aliases, so as to achieve precise config modification**. We recommend using `tools.webpackChain` instead of `tools.webpack`.

> `tools.webpackChain` is executed earlier than tools.webpack and thus will be overridden by changes in `tools.webpack`.

### Utils

#### env

- Type: `'development' | 'production' | 'test'`

The `env` parameter can be used to determine whether the current environment is development, production or test. For example:

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

The `isProd` parameter can be used to determine whether the current environment is production. For example:

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

The `target` parameter can be used to determine the current environment. For example:

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

The `webpack` parameter is the original webpack configuration object. For example:

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

Some common Chain IDs are predefined in the Builder, and you can use these IDs to locate the built-in Rule or Plugin.

##### CHAIN_ID.RULE

| ID             | Description                         |
| -------------- | ---------------------------- |
| `RULE.MJS` | Rule for `mjs`
 |
| `RULE.JS` | Rule for  `js`
 |
| `RULE.TS` | Rule for `ts`
 |
| `RULE.CSS` | Rule for `css`
 |
| `RULE.LESS` | Rule for `less` |
| `RULE.SASS` | Rule for `sass` |
| `RULE.PUG` | Rule for `pug` |
| `RULE.TOML` | Rule for `toml` |
| `RULE.YAML` | Rule for `yaml` |
| `RULE.FONT` | Rule for `font` |
| `RULE.IMAGE` | Rule for `image` |
| `RULE.MEDIA` | Rule for `media` |

### CHAIN_ID.ONE_OF

`ONE_OF.XXX` can match a certain type of rule in the rule array.

| ID                     | 描述                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `ONE_OF.SVG`           | Rules for SVG, automatic choice between data URI and separate file |
| `ONE_OF.SVG_URL`       | Rules for SVG, output as a separate file |
| `ONE_OF.SVG_INLINE`    | Rules for SVG, inlined into bundles as data URIs |
| `ONE_OF.SVG_ASSETS`        | Rules for SVG, automatic choice between data URI and separate file
 |

### CHAIN_ID.USE

`USE.XXX` can match a certain loader.

| ID                     | Description                                  |
| ---------------------- | ------------------------------------- |
| `USE.TS`               | correspond to `ts-loader`                      |
| `USE.CSS`              | correspond to `css-loader`                     |
| `USE.LESS`             | correspond to `less-loader`                    |
| `USE.SASS`             | correspond to `sass-loader`                    |
| `USE.PUG`              | correspond to `pug-loader`                     |
| `USE.TOML`             | correspond to `toml-loader`                    |
| `USE.YAML`             | correspond to `yaml-loader`                    |
| `USE.FILE`             | correspond to `file-loader`                    |
| `USE.URL`              | correspond to `url-loader`                     |
| `USE.SVGR`             | correspond to `@svgr/webpack`                  |
| `USE.BABEL`            | correspond to `babel-loader`                   |
| `USE.STYLE`            | correspond to `style-loader`                   |
| `USE.POSTCSS`          | correspond to `postcss-loader`                 |
| `USE.MARKDOWN`         | correspond to `markdown-loader`                |
| `USE.CSS_MODULES_TS`   | correspond to `css-modules-typescript-loader`  |
| `USE.MINI_CSS_EXTRACT` | correspond to `mini-css-extract-plugin.loader` |

### CHAIN_ID.PLUGIN

`PLUGIN.XXX` can match a certain webpack plugin.

| ID                             | Description                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `PLUGIN.HMR`                   | correspond to `HotModuleReplacementPlugin`                                                  |
| `PLUGIN.COPY`                  | correspond to `CopyWebpackPlugin`                                                           |
| `PLUGIN.HTML`                  | correspond to `HtmlWebpackPlugin`, you need to splice the entry name when using: `${PLUGIN.HTML}-${entryName}` |
| `PLUGIN.DEFINE`                | correspond to `DefinePlugin`                                                                |
| `PLUGIN.IGNORE`                | correspond to `IgnorePlugin`                                                                |
| `PLUGIN.BANNER`                | correspond to `BannerPlugin`                                                                |
| `PLUGIN.PROGRESS`              | correspond to `Webpackbar`                                                                  |
| `PLUGIN.APP_ICON`              | correspond to `AppIconPlugin`                                                               |
| `PLUGIN.LOADABLE`              | correspond to `LoadableWebpackPlugin`                                                       |
| `PLUGIN.MANIFEST`              | correspond to `WebpackManifestPlugin`                                                       |
| `PLUGIN.TS_CHECKER`            | correspond to `ForkTsCheckerWebpackPlugin`                                                  |
| `PLUGIN.INLINE_HTML`           | correspond to `InlineChunkHtmlPlugin`                                                       |
| `PLUGIN.BUNDLE_ANALYZER`       | correspond to `WebpackBundleAnalyzer`                                                       |
| `PLUGIN.BOTTOM_TEMPLATE`       | correspond to `BottomTemplatePlugin`                                                        |
| `PLUGIN.MINI_CSS_EXTRACT`      | correspond to `MiniCssExtractPlugin`                                                        |
| `PLUGIN.REACT_FAST_REFRESH`    | correspond to `ReactFastRefreshPlugin`                                                      |
| `PLUGIN.NODE_POLYFILL_PROVIDE` | correspond to `ProvidePlugin` for node polyfills                                          |
| `PLUGIN.INSPECTOR`             | correspond to `@modern-js/inspector-webpack-plugin`                                         |
| `PLUGIN.SUBRESOURCE_INTEGRITY` | correspond to `webpack-subresource-integrity`                                               |
| `PLUGIN.ASSETS_RETRY`          | correspond to webpack static asset retry plugin in  Builder                                           |
| `AUTO_SET_ROOT_SIZE`           | correspond to automatically set root font size plugin in Builder                                           |

### CHAIN_ID.MINIMIZER

`MINIMIZER.XXX` can match a certain minimizer.

| ID                  | Description                             |
| ------------------- | -------------------------------- |
| `MINIMIZER.JS`      | 对应 `TerserWebpackPlugin`       |
| `MINIMIZER.CSS`     | 对应 `CssMinimizerWebpackPlugin` |
| `MINIMIZER.ESBUILD` | 对应 `ESBuildPlugin`             |

### Examples

The following are some common configuration examples, see the full webpack-chain API [webpack-chain documentation](https://github.com/neutrinojs/webpack-chain).

#### Add/Modify/Delete loader

```js
export default {
  tools: {
    webpackChain: chain => {
      // Add loader
      chain.module
        .rule('md')
        .test(/\.md$/)
        .use('md-loader')
        .loader('md-loader');
      // Modify loader
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use(CHAIN_ID.USE.BABEL)
        .tap(options => {
          options.plugins.push('babel-plugin-xxx');
          return options;
        });
      // Delete loader
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .uses.delete(CHAIN_ID.USE.BABEL);
    },
  },
};
```

#### Add/Modify/Delete plugin

```js
export default {
  tools: {
    webpackChain: chain => {
      // Add plugin
      chain.plugin('define')
        .use(webpack.DefinePlugin, [{
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          },
        }]);
      // Modify plugin
      chain.plugin(CHAIN_ID.PLUGIN.HMR).tap(options => {
        options[0].fullBuildTimeout = 200;
        return options;
      });
      // Delete plugin
      chain.plugins.delete(CHAIN_ID.PLUGIN.HMR);
    },
  },
};
```
