- **类型：** `boolean`
- **默认值：** `false`

是否禁用 CSS 提取逻辑，并将 CSS 文件内联到 JS 文件中。

默认情况下，Builder 会把 CSS 提取为独立的 `.css` 文件，并输出到构建产物目录。设置该选项为 `true` 后，CSS 文件会被内联到 JS 文件中，并在运行时通过 `<style>` 标签插入到页面上。

### 示例

```ts
export default {
  output: {
    disableCssExtract: true,
  },
};
```
