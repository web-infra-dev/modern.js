- Type: `Object`
- Default: `{}`

通过 `tools.devServer` 可以修改 DevServer 的配置。

### Object 类型

#### hot

- Type: `boolean`
- Default: `true`

是否开启 Hot Module Replacement 热更新能力。

#### historyApiFallback

- Type: `boolean | ConnectHistoryApiFallbackOptions`
- Default: `false`

在需要对一些 404 响应或其他请求提供替代页面的场景，可通过 `devServer.historyApiFallback` 进行设置：

```js
export default {
  tools: {
    devServer: {
      historyApiFallback: true,
    },
  },
};
```

更多选项和详细信息可参考 [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) 文档。

#### TODO
