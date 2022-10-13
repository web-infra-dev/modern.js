- Type: `boolean`
- Default: `false`

By default the [runtimeChunk](https://webpack.js.org/configuration/optimization/#optimizationruntimechunk) file will be inlined into html rather than written into dist directory.

This option is used to disable that default behaviour.

```js
export default {
  output: {
    disableInlineRuntimeChunk: true,
  },
};
```
