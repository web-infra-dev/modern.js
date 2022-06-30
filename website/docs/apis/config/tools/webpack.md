---
sidebar_label: webpack
---

# tools.webpack

:::info 适用的工程方案
MWA。
:::

- 类型： `Object | (config, utils) => void`
- 默认值： `undefined`

Modern.js 默认集成了 [webpack](https://webpack.js.org/)，对构建产物进行编译打包等操作，可通过 `tools.webpack` 对其进行配置。

:::info
[tools.webpackChain](/docs/apis/config/tools/webpack-chain) 同样可以修改 webpack 配置，并且功能更加强大，建议优先使用 `tools.webpackChain`。
:::

## 类型

### Object 类型

配置项的值为 `Object` 类型时，Modern.js 会通过 [webpack-merge](https://github.com/survivejs/webpack-merge) 将 `tools.webpack` 参数值和框架的默认 `webpack` 配置合并，得到最终的 `webpack` 配置。

例如，修改 `mode` 配置为 `development`：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    webpack: {
      mode: 'development',
    },
  },
});
```

### Function 类型

配置项的值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终结果；第二个参数为修改 webpack 配置的工具集合。

例如，用函数的方式修改 `mode` 为 `development`：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    webpack: config => {
      config.mode = 'development';
    },
  },
});
```

## 工具函数

`tools.webpack` 值为 `Function` 时，第二个参数对象可用的属性如下。

### env

通过 `env` 参数可以判断当前环境为 `development` 还是 `production`：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpack: (config, { env }) => {
      console.log(env); // => development
    },
  },
});
```

### name

通过 `name` 参数可以判断当前构建产物的运行环境：

- `client`: 默认值，构建产物为运行在浏览器端的代码。
- `server`: 开启 [server.ssr](/docs/apis/config/server/ssr) SSR 后，构建产物为针对 SSR 场景的代码。
- `modern`: 开启 [output.enableModernMode](docs/apis/config/output/enable-modern-mode) 后，构建产物为运行在现代浏览器上的代码。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpack: (config, { name }) => {
      if (name === 'server') {
        // 针对 SSR 场景添加配置
      }
    },
  },
});
```

### webpack

通过 `webpack` 参数可以获取 Modern.js 内部使用的 webpack 对象。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpack: (config, { webpack }) => {
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

### addRules

- 类型： `(rules: RuleSetRule | RuleSetRule[]) => void`

通常情况下，使用 Modern.js 不需要添加额外的 [webpack rule](https://webpack.js.org/configuration/module/#rule-conditions)。当有额外需求时，可以使用该工具函数添加对应的 rules。

以处理 [cson](https://github.com/groupon/cson-parser) 文件为例：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    webpack: (config, { addRules }) => {
      // 添加单条规则
      addRules({
        test: /\.cson/,
        loader: require.resolve('cson-loader'),
      });

      // 以数组形式添加多条规则
      addRules([
        {
          test: /\.foo/,
          loader: require.resolve('foo-loader'),
        },
        {
          test: /\.bar/,
          loader: require.resolve('bar-loader'),
        },
      ]);
    },
  },
});
```

### prependPlugins

- 类型： `(plugins: WebpackPluginInstance | WebpackPluginInstance[]) => void`

在内部 webpack 插件数组头部添加额外的插件（数组头部的插件会优先执行）。

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    webpack: (config, { prependPlugins, webpack }) => {
      // 添加单个插件
      prependPlugins(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      );

      // 以数组形式添加多个插件
      prependPlugins([new PluginA(), new PluginB()]);
    },
  },
});
```

### appendPlugins

- 类型： `(plugins: WebpackPluginInstance | WebpackPluginInstance[]) => void`

在内部 webpack 插件数组尾部添加额外的插件（数组尾部的插件会在最后执行）。

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    webpack: (config, { appendPlugins, webpack }) => {
      // 添加单个插件
      appendPlugins([
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      ]);

      // 以数组形式添加多个插件
      appendPlugins([new PluginA(), new PluginB()]);
    },
  },
});
```

### removePlugin

- 类型： `(name: string) => void`

删除内部的 webpack 插件，参数为该插件的 `constructor.name`。

例如，删除内部的 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    webpack: (config, { removePlugin }) => {
      removePlugin('ForkTsCheckerWebpackPlugin');
    },
  },
});
```

### chain (废弃)

此参数已废弃，请使用 [tools.webpackChain](/docs/apis/config/tools/webpack-chain)。

当使用 `chain` 参数时，修改 config 对象或返回 config 对象都不会产生任何效果。

## 常见问题

### 如何查看最终生效的 webpack 配置？

可以通过 [modern inspect](/docs/apis/commands/mwa/inspect) 命令来查看最终生效的 webpack 配置，从而确定 `tools.webpack` 的改动是否正确应用到 webpack 配置上。
