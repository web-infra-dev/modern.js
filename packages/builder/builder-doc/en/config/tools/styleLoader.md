- Type: `Object | Function`
- Default: `undefined`

The config of [style-loader](https://github.com/webpack-contrib/style-loader) can be set through `tools.styleLoader`. The default config is an empty object.

It is worth noting that builder does not enable `style-loader` by default. If this value is set to Object/Function type, `style-loader` will be enabled in development environment.In production build, we will still use [mini-css-extract-plugin](./cssExtract.md) to extract CSS.

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
