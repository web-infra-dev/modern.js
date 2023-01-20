- **Type:** `CopyPluginOptions | CopyPluginOptions['patterns']`
- **Default:** `undefined`

Copies the specified file or directory to the dist directory.

For example, copy the files under `src/assets` to the dist directory:

```js
export default {
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
};
```

For more detailed configuration, please refer to: [copy-webpack-plugin](https://github.com/webpack-contrib/copy-webpack-plugin).
