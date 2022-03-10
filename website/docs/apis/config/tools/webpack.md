---
sidebar_label: webpack
sidebar_position: 11
---

# `tools.webpack`

:::info 适用的工程方案
- MWA
:::

- 类型： `(config, { dev, chain, webpack }) => void`
- 默认值： `undefined`

对应 [webpack](https://webpack.js.org/) 的配置，值为 `Function` 类型。

- 函数的第一个参数为内部的默认配置（只读）。
- 函数的第二个参数为修改 webpack 配置的工具集合，包括 `chain`、`env`、`webpack` 等。

### chain

函数第二个参数中的 `chain` 对象是一个 [webpack-chain](https://github.com/neutrinojs/webpack-chain) 实例，通过 `chain` 可以对 webpack 配置进行变更:

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpack: (config, { chain }) => {
      chain.resolve.alias.set('@example', `${appDirectory}/src/example`);
    },
  },
});
```

以下是 `chain` 常见用法的示例：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpack: (config, { chain }) => {
      // 自定义 loader
      chain.module
        .rule('compile-svg')
        .test(/\.svg$/)
        .use('svg-inline')
        .loader('svg-inline-loader');

      // 自定义 plugin
      chain
        .plugin('clean')
        .use(CleanPlugin, [['dist'], { root: '/dir' }]);

      // 修改 SourceMap 格式
      chain.devtool('source-map');
    },
  },
});
```

完整 API 请参考 [webpack-chain 文档](https://github.com/neutrinojs/webpack-chain)。

### env

获取当前环境值为 `development` 还是 `production`：

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

获取 Modern.js 内部使用的 webpack 对象：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpack: (config, { webpack }) => {
      console.log(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        })
      );
    },
  },
});
```
