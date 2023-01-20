- **Type:** `boolean`
- **Default:** `false`

是否禁用生产环境下的代码压缩。

默认情况下，JS 代码和 CSS 代码会在生产环境构建时被自动压缩。如果不希望执行代码压缩，可以将 `disableMinimize` 设置为 `true`。

```js
export default {
  output: {
    disableMinimize: true,
  },
};
```
