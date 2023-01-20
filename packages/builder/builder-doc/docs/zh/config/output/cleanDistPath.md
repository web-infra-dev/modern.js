- **Type:** `boolean`
- **Default:** `true`

是否在构建开始前清理 dist 目录下的所有文件。

默认情况下，Builder 会自动清理 dist 目录下的文件，你可以把 `cleanDistPath` 设置为 `false` 来禁用该行为。

```js
export default {
  output: {
    cleanDistPath: false,
  },
};
```
