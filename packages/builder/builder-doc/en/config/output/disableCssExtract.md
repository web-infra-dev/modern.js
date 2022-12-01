- Type: `boolean`
- Default: `false`

Whether to disable CSS extract and inline CSS files into JS files.

By default, Builder will extract CSS into a separate `.css` file and output it to the dist directory. When this option is set to `true`, CSS files will be inlined into JS files and inserted on the page at runtime via `<style>` tags.

### Example

```ts
export default {
  output: {
    disableCssExtract: true,
  },
};
```
