- **Type:** `boolean`
- **Default:** `true`

Whether to clean all files in the dist path before starting compilation.

By default, Builder clean up the dist file, you can disable this behavior by setting `cleanDistPath` to `false`.

```js
export default {
  output: {
    cleanDistPath: false,
  },
};
```
