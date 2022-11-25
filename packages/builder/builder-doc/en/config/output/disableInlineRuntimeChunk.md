- Type: `boolean`
- Default: `false`

Controls whether to the inline the [runtime chunk](https://webpack.js.org/configuration/optimization/#optimizationruntimechunk) to HTML.

By default the runtime chunk file will be inlined into HTML rather than written into dist directory, this can reduce the HTTP request number.

This option is used to disable that default behavior.

```js
export default {
  output: {
    disableInlineRuntimeChunk: true,
  },
};
```
