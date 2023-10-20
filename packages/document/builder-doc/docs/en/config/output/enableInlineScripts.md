- **Type:**

```ts
type EnableInlineScripts =
  | boolean
  | RegExp
  | ((params: { size: number; name: string }) => boolean);
```

- **Default:** `false`
- **Bundler:** `only support webpack`

Whether to inline output scripts files (.js files) into HTML with `<script>` tags in production mode.

Note that, with this option on, the scripts files will no longer be written in dist directory, they will only exist inside the HTML file instead.

:::tip
When using convention-based routing, you need to set [output.splitRouteChunks](https://modernjs.dev/en/configure/app/output/splitRouteChunks.html) to false if this option is turned on.
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

### Using RegExp

If you need to inline part of the JS files, you can set `enableInlineScripts` to a regular expression that matches the URL of the JS file that needs to be inlined.

For example, to inline `main.js` into HTML, you can add the following configuration:

```js
export default {
  output: {
    enableInlineScripts: /\/main\.\w+\.js$/,
  },
};
```

:::tip
The production filename includes a hash value by default, such as `static/js/main.18a568e5.js`. Therefore, in regular expressions, `\w+` is used to match the hash.
:::

### Using Function

You can also set `output.enableInlineScripts` to a function that accepts the following parameters:

- `name`: The filename, such as `static/js/main.18a568e5.js`.
- `size`: The file size in bytes.

For example, if we want to inline assets that are smaller than 10KB, we can add the following configuration:

```js
export default {
  output: {
    enableInlineScripts({ size }) {
      return size < 10 * 1000;
    },
  },
};
```
