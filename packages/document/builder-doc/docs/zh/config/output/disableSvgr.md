- **类型：** `boolean`
- **默认值：** `false`

是否调用 SVGR 将 SVG 转化为 React 组件。如果设置为 true，将把所有的.svg 文件视为资源处理。

默认情况下，在 JS 文件中引用 SVG 资源时，Builder 会调用 SVGR，将 SVG 图片转换为一个 React 组件。
如果你确定项目内的所有 SVG 资源都没有当成 React 组件使用时，可以通过将 `disableSvgr` 设置为 true 来关闭此项转换，以提升构建性能。

```js
export default {
  output: {
    disableSvgr: true,
  },
};
```
