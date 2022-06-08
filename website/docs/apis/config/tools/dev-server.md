---
sidebar_label: devServer
---

# tools.devServer

:::info 适用的工程方案
MWA。
:::

- 类型： `Object`
- 默认值： `{}`

对应 DevServer 的配置，用于配置开发环境运行的服务器的选项：

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

## 配置项

Modern.js 基于 [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 实现 DevServer，大部分配置与 [webpack-dev-server](https://webpack.js.org/api/webpack-dev-server/) 完全一致，少部分配置存在差异。

对于存在差异的配置，一部分可以使用 Modern.js 中的其他配置项代替，也有一部分配置还未实现或无需实现，下方完整列出了这些内容。

### 支持的配置项

| 配置名        | 作用                               | 支持状态 |
| ------------- | ---------------------------------- | -------- |
| client        | 配置 dev-server 相关功能，如日志等 | Y        |
| compress      | 是否开启 gzip 压缩                 | N        |
| devMiddleware | webpack-dev-middleware 相关配置    | Y        |
| https         | 开启 https                         | Y        |
| headers       | 设置自定义响应头                   | Y        |
| hot           | 是否可以使用 webpack 热模块替换    | Y        |
| liveReload    | 是否可以 reload 页面               | Y        |
| onListening   | 监听启动                           | N        |
| open          | 构建完成后自动打开页面             | N        |
| proxy         | 代理                               | Y        |
| watchFiles    | 需要监听的文件                     | N        |


### 拥有替代功能的配置项

| 配置名                  | 作用                                                         | 替代方案                            |
| ----------------------- | ------------------------------------------------------------ | ----------------------------------- |
| historyApiFallback      | 重定向部分 URL                                               | [server.routes](/docs/apis/config/server/routes)                       |
| onAfterSetupMiddleware  | 在 webpack-dev-server internal middleware 后执行，可以添加后续中间件 | devServer.after                     |
| onBeforeSetupMiddleware | 在 webpack-dev-server internal middleware 前执行，可以添加前置中间件 | devServer.before                    |
| port                    | dev server 监听端口                                          | [server.port](/docs/apis/config/server/port)                         |
| static                  | 托管静态资源文件                                             | [config/public](/docs/apis/hooks/mwa/config/public) 和 [server.publicRoutes](/docs/apis/config/server/public-routes) 或 [config/upload](/docs/apis/hooks/mwa/config/upload) |

### API

#### hot

- 类型： `boolean`
- 默认值： `true`

是否开启 webpack 的 [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) 热更新能力。

关闭这项配置后，会移除 [HotModuleReplacementPlugin](https://webpack.js.org/plugins/hot-module-replacement-plugin/) 与 [react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)。

#### liveReload

- 类型： `boolean`
- 默认值： `true`

默认情况下，当监听到文件变化时，dev server 将会刷新页面。

通过这个配置项可以关闭该行为。

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
