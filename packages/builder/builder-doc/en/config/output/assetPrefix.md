- Type: `boolean | string`
- Default: `'/'`

When using CDN in the production environment, you can use this option to set the URL prefix of static assets, similar to the [output.publicPath](https://webpack.js.org/guides/public-path/) config of webpack.

`assetPrefix` will affect the URLs of most of the static assets, including JavaScript files, CSS files, images, videos, etc. If an incorrect value is specified, you'll receive 404 errors while loading these resources.

This config is only used in the production environment. In the development environment, please use the `dev.assetPrefix` to set the URL prefix.

After setting, the URLs of JavaScript, CSS and other static files will be prefixed with `output.assetPrefix`:

#### Example

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
