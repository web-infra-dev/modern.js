- Type: `boolean | string`
- Default: `'/'`

在生产环境使用 CDN 部署时，可使用该选项设置静态资源的 URL 前缀，对应 webpack 的 [output.publicPath](https://webpack.js.org/guides/public-path/) 配置。

该配置项仅用于生产环境。在开发环境下，请使用 `dev.assetPrefix` 配置项进行设置。

设置后，项目的 JavaScript、CSS、图片等静态资源的 URL 都会加上 `output.assetPrefix` 作为前缀：

#### 示例

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
