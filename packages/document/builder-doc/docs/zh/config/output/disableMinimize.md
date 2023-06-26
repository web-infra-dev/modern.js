- **类型：** `boolean`
- **默认值：** `false`

是否禁用生产环境下的代码压缩。

默认情况下，JS 代码和 CSS 代码会在生产环境构建时被自动压缩，从而提升页面性能。如果你不希望执行代码压缩，可以将 `disableMinimize` 设置为 `true`。

```js
export default {
  output: {
    disableMinimize: true,
  },
};
```

:::tip
该配置项通常用于代码调试和问题排查，不建议在生产环境禁用代码压缩，否则会导致页面性能显著下降。
:::
