---
sidebar_label: assetPrefix
sidebar_position: 3
---

# dev.assetPrefix

- 类型： `boolean | string`
- 默认值： `undefined`

设置开发环境下的静态资源 URL 前缀，对应 webpack 的 [output.publicPath](https://webpack.js.org/guides/public-path/) 配置。

在生产环境下，请使用 [output.assetPrefix](/docs/apis/app/config/dev/asset-prefix) 配置项进行设置。

## 类型

### boolean 类型

当值的类型为 `boolean` 时，设置为 `true`，会自动添加 `//ip:port/` 作为访问前缀：

```js title="modern.config.js"
export default defineConfig({
  dev: {
    assetPrefix: true,
  },
});
```

对应 JS 文件在浏览器中加载的地址如下：

```js
<script defer src="//${ip}:8080/static/js/main.js"></script>
```

设置为 `false` 或不设置，则默认使用 `/` 作为访问前缀。

### string 类型

当值的类型为 `string` 时，会作为前缀，自动拼接到静态资源访问路径上：

```js
export default defineConfig({
  dev: {
    assetPrefix: 'http://example.com/assets/',
  },
};
```

对应 JS 文件在浏览器中加载的地址如下：

```js
<script defer src="http://example.com/assets/static/js/main.js"></script>
```

## 微前端场景

当项目中启用了微前端功能 `@modern-js/plugin-garfish` 时，Garfish 会自动设置 `dev.assetPrefix` 的值为 `//localhost:${port}/`，以保证微前端场景下的功能可以正常使用，因此 `dev.assetPrefix` 将无法被修改。
