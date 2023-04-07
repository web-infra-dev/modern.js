- **Type:** `boolean`
- **Default:** `false`
- **Bundler:** `only support webpack`

Whether to inline output scripts files (.js files) into HTML with `<script>` tags in production mode.

Note that, with this option on, the scripts files will no longer be written in dist directory, they will only exist inside the HTML file instead.

:::note
When using convention-based routing, you need to set [`output.splitRouteChunks`](https://modernjs.dev/en/configure/app/output/splitRouteChunks.html) to false if this option is turned on.
:::

### Example

By default, we have following output files:

```bash
dist/html/main/index.html
dist/static/css/style.css
dist/static/js/main.js
```

After turn on the `output.enableInlineScripts` option:

```js
export default {
  output: {
    enableInlineScripts: true,
  },
};
```

The output files will become:

```bash
dist/html/main/index.html
dist/static/css/style.css
```

And `dist/static/js/main.js` will be inlined in `index.html`:

```html
<html>
  <body>
    <script>
      // content of dist/static/js/main.js
    </script>
  </body>
</html>
```
