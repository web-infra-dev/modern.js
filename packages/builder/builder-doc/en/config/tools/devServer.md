- Type: `Object`
- Default: `{}`

The config of DevServer can be modified through `tools.devServer`.

### Object Type

#### hot

- Type: `boolean`
- Default: `true`

Enable Hot Module Replacement feature.

#### historyApiFallback

- Type: `boolean | ConnectHistoryApiFallbackOptions`
- Default: `false`

The index.html page will likely have to be served in place of any 404 responses. Enable devServer.historyApiFallback by setting it to true:

```js
export default {
  tools: {
    devServer: {
      historyApiFallback: true,
    },
  },
};
```

For more options and information, see the [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) documentation.

#### TODO
