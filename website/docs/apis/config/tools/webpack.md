---
sidebar_label: webpack
---

# tools.webpack

:::info 适用的工程方案
MWA。
:::

- 类型： `Object | (config, { env, name, webpack }) => void`
- 默认值： `undefined`

Modern.js 默认集成了 [webpack](https://webpack.js.org/)，对构建产物进行编译打包等操作，可通过 `tools.webpack` 对其进行配置。

:::info
[tools.webpackChain](/docs/apis/config/tools/webpack-chain) 同样可以修改 webpack 配置，并且功能更加强大，建议优先使用 `tools.webpackChain`。
:::

## 类型

### Object 类型

当值为 `Object` 类型时，Modern.js 会通过 [webpack-merge](https://github.com/survivejs/webpack-merge) 将 `tools.webpack` 参数值和框架的默认 `webpack` 配置合并，得到最终的 `webpack` 配置。

例如，修改 `mode` 配置为 `development`：

```typescript title="modern.config.ts"
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

当值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终结果；第二个参数为修改 webpack 配置的工具集合。

例如，用函数的方式修改 `mode` 为 `development`：

```typescript title="modern.config.ts"
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

### chain (废弃)

此参数已废弃，请使用 [tools.webpackChain](/docs/apis/config/tools/webpack-chain)。

当使用 `chain` 参数时，修改 config 对象或返回 config 对象都不会产生任何效果。
