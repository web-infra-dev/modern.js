- **类型：** `string`
- **默认值：** `'/'`

在生产环境使用 CDN 部署时，可使用该选项设置静态资源的 URL 前缀。

`assetPrefix` 会影响构建产物中绝大部分静态资源的 URL，包括 JavaScript 文件、CSS 文件、图片、视频等。如果指定了一个错误的值，则在加载这些资源时可能会出现 404 错误。

该配置项仅用于生产环境。在开发环境下，请使用 `dev.assetPrefix` 配置项进行设置。

设置后，项目的 JavaScript、CSS、图片等静态资源的 URL 都会加上 `output.assetPrefix` 作为前缀：

### 示例

```js
export default {
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
};
```

构建之后，可以看到 JS 文件从以下地址加载：

```html
<script
  defer
  src="https://cdn.example.com/assets/static/js/main.ebc4ff4f.js"
></script>
```

### 与原生配置的区别

`output.assetPrefix` 对应以下原生配置：

- webpack 的 [output.publicPath](https://webpack.js.org/guides/public-path/) 配置。
- Rspack 的 [output.publicPath](https://www.rspack.dev/zh/config/output.html#outputpublicpath) 配置。

它与原生配置的区别在于：

- `output.assetPrefix` 仅在生产环境下生效。
- `output.assetPrefix` 默认会自动补全尾部的 `/`。
- `output.assetPrefix` 的值会写入 `process.env.ASSET_PREFIX` 环境变量。
