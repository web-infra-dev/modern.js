- **Type:** `string`
- **Default:** `'/'`

When using CDN in the production environment, you can use this option to set the URL prefix of static assets.

`assetPrefix` will affect the URLs of most of the static assets, including JavaScript files, CSS files, images, videos, etc. If an incorrect value is specified, you'll receive 404 errors while loading these resources.

This config is only used in the production environment. In the development environment, please use the `dev.assetPrefix` to set the URL prefix.

After setting, the URLs of JavaScript, CSS and other static files will be prefixed with `output.assetPrefix`:

### Example

```js
export default {
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
};
```

After building, you can see that the JS files are loaded from:

```html
<script
  defer
  src="https://cdn.example.com/assets/static/js/main.ebc4ff4f.js"
></script>
```

### Differences from Native Configuration

`output.assetPrefix` corresponds to the following native configurations:

- [output.publicPath](https://webpack.js.org/guides/public-path/) configuration in webpack.
- [output.publicPath](https://www.rspack.dev/config/output.html#outputpublicpath) configuration in Rspack.

The differences from the native configuration are as follows:

- `output.assetPrefix` only takes effect in the production environment.
- `output.assetPrefix` automatically appends a trailing `/` by default.
- The value of `output.assetPrefix` is written to the `process.env.ASSET_PREFIX` environment variable.
