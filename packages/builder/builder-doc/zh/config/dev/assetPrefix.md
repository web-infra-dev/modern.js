- Type: `boolean | string`
- Default: `'/'`

设置开发环境下的静态资源 URL 前缀，对应 webpack 的 [output.publicPath](https://webpack.js.org/guides/public-path/) 配置。

该配置项仅用于开发环境。在生产环境下，请使用 `output.assetPrefix` 配置项进行设置。

#### Boolean 类型

如果设置 `assetPrefix` 为 `true`，Builder 会自动计算出 `//ip:port/` 作为 URL 前缀：

```js
export default {
  dev: {
    assetPrefix: true,
  },
};
```

对应 JS 文件在浏览器中加载的地址如下：

```js
<script defer src="//${ip}:8080/static/js/main.js"></script>
```

如果设置 `assetPrefix` 为 `false` 或不设置，则默认使用 `/` 作为访问前缀。

#### String 类型

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
