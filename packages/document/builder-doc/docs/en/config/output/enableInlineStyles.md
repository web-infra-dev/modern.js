- **Type:**

```ts
type EnableInlineStyles =
  | boolean
  | RegExp
  | ((params: { size: number; name: string }) => boolean);
```

- **Default:** `false`

Whether to inline output style files (.css files) into HTML with `<style>` tags in production mode.

Note that, with this option on, the style files will no longer be written in dist directory, they will only exist inside the HTML file instead.

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

After turn on the `output.enableInlineStyles` option:

```js
export default {
  output: {
    enableInlineStyles: true,
  },
};
```

The output files will become:

```bash
dist/html/main/index.html
dist/static/js/main.js
```

And `dist/static/css/style.css` will be inlined in `index.html`:

```html
<html>
  <head>
    <style>
      /* content of dist/static/css/style.css */
    </style>
  </head>
  <body></body>
</html>
```

### Using RegExp

If you need to inline part of the CSS files, you can set `enableInlineStyles` to a regular expression that matches the URL of the CSS file that needs to be inlined.

For example, to inline `main.css` into HTML, you can add the following configuration:

```js
export default {
  output: {
    enableInlineStyles: /\/main\.\w+\.css$/,
  },
};
```

:::tip
The production filename includes a hash value by default, such as `static/css/main.18a568e5.css`. Therefore, in regular expressions, `\w+` is used to match the hash.
:::

### Using Function

You can also set `output.enableInlineStyles` to a function that accepts the following parameters:

- `name`: The filename, such as `static/css/main.18a568e5.css`.
- `size`: The file size in bytes.

For example, if we want to inline assets that are smaller than 10KB, we can add the following configuration:

```js
export default {
  output: {
    enableInlineStyles({ size }) {
      return size < 10 * 1000;
    },
  },
};
```
