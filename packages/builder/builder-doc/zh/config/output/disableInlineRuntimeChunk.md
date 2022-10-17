- Type: `boolean`
- Default: `false`

默认情况下，[runtimeChunk](https://webpack.js.org/configuration/optimization/#optimizationruntimechunk) 文件将会被 inline 到 html 文件中，而不是写到产物目录中。

这个选项用来关闭这个默认行为。

```js
export default {
  output: {
    disableInlineRuntimeChunk: true,
  },
};
```
