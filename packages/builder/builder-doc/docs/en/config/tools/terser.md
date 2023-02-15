- **Type:** `Object | Function | undefined`
- **Default:**

```js
const defaultTerserOptions = {
  terserOptions: {
    mangle: {
      safari10: true,
    },
  },
};
```
- **Bundler:** `only support webpack`

When building for production, Builder will minimize the JavaScript code through [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin). The config of [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) can be modified via `tools.terser`.

### Object Type

When `tools.terser` is `Object` type, it will be merged with the default config via `Object.assign`.

For example, to exclude some files from minification:

```js
export default {
  tools: {
    terser: {
      exclude: /\/excludes/,
    },
  },
};
```

### Function Type

When `tools.terser` is `Function` type, the default config is passed in as the first parameter, the config object can be modified directly, or a value can be returned as the final result.

```js
export default {
  tools: {
    terser: opts => {
      opts.exclude = /\/excludes/;
    },
  },
};
```
