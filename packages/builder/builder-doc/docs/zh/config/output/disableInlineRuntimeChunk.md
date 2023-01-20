- **Type:** `boolean`
- **Default:** `false`

用于控制是否内联 [runtimeChunk](https://webpack.js.org/configuration/optimization/#optimizationruntimechunk) 到 HTML 中。

在生产环境下，runtime chunk 文件将会默认被内联到 HTML 文件中，而不是写到产物目录中，这样可以减少文件请求的数量。

这个选项用来关闭这个默认行为。

```js
export default {
  output: {
    disableInlineRuntimeChunk: true,
  },
};
```
