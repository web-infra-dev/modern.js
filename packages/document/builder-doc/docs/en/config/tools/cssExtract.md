- **Type:** `Object | Function`
- **Default:**

```js
const defaultOptions = {
  // The loader options
  loaderOptions: {},
  // The plugin options
  pluginOptions: {
    // The default value of cssPath is `static/css`
    // while the default value of cssFilename is `[name].[contenthash:8].css`
    filename: `${cssPath}/${cssFilename}`,
    chunkFilename: `${cssPath}/async/${cssFilename}`,
    ignoreOrder: true,
  },
};
```

- **Bundler:** `only support webpack`

The config of [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) can be modified through `tools.cssExtract`.

### Object Type

When this value is an Object, it is merged with the default config via Object.assign. For example:

```js
export default {
  tools: {
    cssExtract: {
      pluginOptions: {
        filename: 'static/css/[name].[contenthash:8].css',
      },
    },
  },
};
```

### Function Type

When the value a Function, the default config is passed in as the first parameter. You can modify the config object directly, or return an object as the final config. For example:

```js
export default {
  tools: {
    cssExtract: config => {
      config.pluginOptions.filename = 'static/css/[name].[contenthash:8].css';
      return config;
    },
  },
};
```

For more config details, please refer to [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin).
