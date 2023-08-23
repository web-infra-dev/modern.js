- **类型：** `boolean | string`
- **默认值：** `'/'`

设置开发环境下的静态资源 URL 前缀。

`assetPrefix` 会影响构建产物中绝大部分静态资源的 URL，包括 JavaScript 文件、CSS 文件、图片、视频等。如果指定了一个错误的值，则在加载这些资源时可能会出现 404 错误。

该配置项仅用于开发环境。在生产环境下，请使用 `output.assetPrefix` 配置项进行设置。

### Boolean 类型

如果设置 `assetPrefix` 为 `true`，Builder 会使用 `http://localhost:port/` 作为 URL 前缀：

```js
export default {
  dev: {
    assetPrefix: true,
  },
};
```

对应 JS 文件在浏览器中加载的地址如下：

```js
<script defer src="http://localhost:8080/static/js/main.js"></script>
```

如果设置 `assetPrefix` 为 `false` 或不设置，则默认使用 `/` 作为访问前缀。

### String 类型

当 `assetPrefix` 的值为 `string` 类型时，字符串会作为前缀，自动拼接到静态资源访问 URL 上：

```js
export default {
  dev: {
    assetPrefix: 'http://example.com/assets/',
  },
};
```

对应 JS 文件在浏览器中加载的地址如下：

```js
<script defer src="http://example.com/assets/static/js/main.js"></script>
```

### 与原生配置的区别

`dev.assetPrefix` 对应以下原生配置：

- webpack 的 [output.publicPath](https://webpack.js.org/guides/public-path/) 配置。
- Rspack 的 [output.publicPath](https://www.rspack.dev/zh/config/output.html#outputpublicpath) 配置。

它与原生配置的区别在于：

- `dev.assetPrefix` 仅在开发环境下生效。
- `dev.assetPrefix` 默认会自动补全尾部的 `/`。
- `dev.assetPrefix` 的值会写入 `process.env.ASSET_PREFIX` 环境变量。
