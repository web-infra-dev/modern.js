- **Type:** `boolean`
- **Default:** `false`

Whether to inline output scripts files (.js files) into HTML with `<script>` tags in production mode.

Note that, with this option on, the scripts files will no longer be written in dist directory, they will only exist inside the HTML file instead.

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
