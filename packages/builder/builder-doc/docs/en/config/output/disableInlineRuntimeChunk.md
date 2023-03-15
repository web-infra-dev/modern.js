- **Type:** `boolean`
- **Default:** `false`

Used to control whether to inline the bundler's runtime code into HTML.


:::tip What is runtimeChunk
Builder will generate a `builder-runtime.js` file in the dist directory, which is the runtime code of webpack or Rspack.

runtimeChunk is a piece of runtime code, which is provided by webpack or Rspack, that contains the necessary module processing logic, such as module loading, module parsing, etc. See [Runtime](https://webpack.js.org/concepts/manifest/#runtime) for details.

:::

In the production environment, Builder will inline the runtimeChunk file into the HTML file by default instead of writing it to the dist directory. This is done to reduce the number of file requests.

### Disable Inlining

If you don't want the runtimeChunk file to be inlined into the HTML file, you can set `disableInlineRuntimeChunk` to `true` and a separate `builder-runtime.js` file will be generated.

```js
export default {
  output: {
    disableInlineRuntimeChunk: true,
  },
};
```

### Merge Into Page Chunk

If you don't want to generate a separate runtimeChunk file, but want the runtimeChunk code to be bundled into the page chunk, you can set the config like this:

```js
export default {
  tools: {
    webpack: {
      optimization: {
        runtimeChunk: false,
      },
    },
  },
};
```
