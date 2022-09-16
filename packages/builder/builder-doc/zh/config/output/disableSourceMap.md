- Type: `boolean`
- Default: `false`

默认情况下，Builder 在生产环境构建时会生成 JS 和 CSS 资源的 SourceMap，用于调试和排查线上问题。

如果项目在生产环境下不需要 SourceMap，可以关闭该功能，从而提升 build 构建的速度。

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```
