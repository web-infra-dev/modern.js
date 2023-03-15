- **类型：** `boolean`
- **默认值：** `false`

用于控制是否将打包工具的 runtime 代码内联到 HTML 中。


:::tip 什么是 runtimeChunk
当 Builder 构建完成后，会在 dist 目录生成 `builder-runtime.js` 文件，该文件为 webpack 或 Rspack 的 runtime 代码，即 runtimeChunk。

runtimeChunk 是一段运行时代码，它由 webpack 或 Rspack 提供，包含必要的模块处理逻辑，比如模块加载、模块解析等，具体可参考 [Runtime](https://webpack.js.org/concepts/manifest/#runtime)。

:::

在生产环境下，Builder 默认会将 runtimeChunk 文件内联到 HTML 文件中，而不是写到产物目录中，这样做是为了减少文件请求的数量。

### 禁用内联

如果你不希望 runtimeChunk 文件被内联到 HTML 文件里，可以把 `disableInlineRuntimeChunk` 设置为 `true`，此时会生成一个独立的 `builder-runtime.js` 文件。

```js
export default {
  output: {
    disableInlineRuntimeChunk: true,
  },
};
```

### 合并到页面文件中

如果你不希望生成独立的 runtimeChunk 文件，而是想让 runtimeChunk 代码被打包到页面的 JS 文件里，可以这样设置：

```js
export default {
  tools: {
    webpack: {
      optimization: {
        runtimeChunk: false,
      },
    },
  },
};
```
