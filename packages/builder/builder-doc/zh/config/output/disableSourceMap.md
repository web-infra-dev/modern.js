- Type: `boolean`
- Default: `false`

是否禁用 Source Map。

默认情况下，Builder 在构建时会生成 JS 和 CSS 资源的 SourceMap，用于调试和排查线上问题。

如果项目不需要 SourceMap，可以关闭该功能，从而提升构建的速度。

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```

如果希望开启开发环境的 Source Map，并在禁用生产环境禁用，可以设置为：

```js
export default {
  output: {
    disableSourceMap: process.env.NODE_ENV === 'production',
  },
};
```
