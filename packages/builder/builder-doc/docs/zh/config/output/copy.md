- **Type:** `CopyPluginOptions | CopyPluginOptions['patterns']`
- **Default:** `undefined`

将指定的文件或目录拷贝到构建输出目录中。

例如，将 `src/assets` 下的文件直接拷贝到 dist 目录：

```js
export default {
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
};
```

更详细的配置项请参考：[copy-webpack-plugin](https://github.com/webpack-contrib/copy-webpack-plugin) 文档。
