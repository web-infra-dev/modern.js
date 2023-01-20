- **Type:** `boolean | string`
- **Default:** `'/'`

Set the URL prefix of static assets in the development environment, similar to the [output.publicPath](https://webpack.js.org/guides/public-path/) config of webpack.

`assetPrefix` will affect the URLs of most of the static assets, including JavaScript files, CSS files, images, videos, etc. If an incorrect value is specified, you'll receive 404 errors while loading these resources.

This config is only used in the development environment. In the production environment, please use the `output.assetPrefix` to set the URL prefix.

#### Boolean Type

If `assetPrefix` is set to `true`, the URL prefix will be `//ip:port/`:

```js
export default {
  dev: {
    assetPrefix: true,
  },
};
```

The script URL will be:

```js
<script defer src="//${ip}:8080/static/js/main.js"></script>
```

If `assetPrefix` is set to `false` or not set, `/` is used as the default value.

#### String type

When the value of `assetPrefix` is `string` type, the string will be used as the URL prefix:

```js
export default {
  dev: {
    assetPrefix: 'http://example.com/assets/',
  },
};
```

The script URL will be:

```js
<script defer src="http://example.com/assets/static/js/main.js"></script>
```
