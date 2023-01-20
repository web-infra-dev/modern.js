- **Type:** `boolean`
- **Default:** `false`

Whether to disable code minification in production build.

By default, JS code and CSS code are minified during production build. If you do not want to minify the code, you can set `disableMinimize` to `true`.

```js
export default {
  output: {
    disableMinimize: true,
  },
};
```
