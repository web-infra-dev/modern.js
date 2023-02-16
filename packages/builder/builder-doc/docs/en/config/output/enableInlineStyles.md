- **Type:** `boolean`
- **Default:** `false`
- **Bundler:** `only support webpack`

Whether to inline output style files (.css files) into HTML with `<style>` tags in production mode.

Note that, with this option on, the style files will no longer be written in dist directory, they will only exist inside the HTML file instead.

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
  <body>
  </body>
</html>
```
