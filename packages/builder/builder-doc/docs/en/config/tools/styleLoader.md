- **Type:** `Object | Function`
- **Default:** `{}`
- **Bundler:** `only support webpack`

The config of [style-loader](https://github.com/webpack-contrib/style-loader) can be set through `tools.styleLoader`.

It is worth noting that Builder does not enable `style-loader` by default. You can use `output.disableCssExtract` config to enable it。

### Object Type

When this value is an Object, it is merged with the default config via Object.assign. For example:

```js
export default {
  tools: {
    styleLoader: {
      loaderOptions: {
        insert: 'head',
      },
    },
  },
};
```

### Function Type

When the value is a Function, the default config is passed in as the first parameter. You can modify the config object directly, or return an object as the final config. For example:

```js
export default {
  tools: {
    styleLoader: config => {
      config.loaderOptions.insert = 'head';
      return config;
    },
  },
};
```
