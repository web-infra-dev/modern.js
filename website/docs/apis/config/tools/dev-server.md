---
sidebar_label: devServer
---

# tools.devServer

:::info 适用的工程方案
MWA。
:::

- 类型： `Object`
- 默认值： `{}`

对应 [DevServer](https://webpack.docschina.org/configuration/dev-server/#devserverlivereload) 的配置，用于配置开发环境运行的服务器的选项：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    devServer: {
      hot: true,
      https: false,
      liveReload: true,
    },
  },
});
```

:::tip 提示
为了方便接入，Modern.js 大部分配置与 Webpack DevServer 保持一致，部分配置仍有差异。
:::

## 配置项

### hot

- 类型： `boolean`
- 默认值： `true`

是否开启 webpack 的 [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) 热更新能力。

关闭这项配置后，会移除 [HotModuleReplacementPlugin](https://webpack.js.org/plugins/hot-module-replacement-plugin/) 与 [react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)。

### liveReload

- 类型： `boolean`
- 默认值： `true`

默认情况下，当监听到文件变化时，dev server 将会刷新页面。

通过这个配置项可以关闭该行为。

## 配置差异

### before

:::info 实验性的
这是一个实验性功能。
:::

- 类型： `Array`
- 默认值： `null`

在所有开发环境中间件前执行：

```js
devServer: {
  before: [
    async (req, res, next) => {
      console.log('before dev middleware');
      next();
    },
  ],
},
```

### after

:::info 实验性的
这是一个实验性功能。
:::

- 类型： `Array`
- 默认值： `null`

在所有开发环境中间件后执行：

```js
devServer: {
  after: [
    async (req, res, next) => {
      console.log('after dev middleware');
      next();
    },
  ],
},
```
