- Type: `Object | Function | undefined`
- Default:

```js
const defaultOptions = {
  minimizerOptions: {
    preset: [
      'default',
      {
        mergeLonghand: false,
      },
    ],
  },
};
```

When building for production, Builder will minimize the CSS code through [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin). The config of [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) can be modified via `tools.minifyCss`.

### Object Type

When `tools.minifyCss` is `Object` type, it will be merged with the default config via `Object.assign`.

For example, modify the `preset` config of [cssnano](https://cssnano.co/):

```js
export default {
  tools: {
    minifyCss: {
      minimizerOptions: {
        preset: require.resolve('cssnano-preset-simple'),
      },
    },
  },
};
```

### Function Type

When `tools.minifyCss` is `Function` type, the default config is passed in as the first parameter, the config object can be modified directly, or a value can be returned as the final result.

```js
export default {
   tools: {
    minifyCss: options => {
      options.minimizerOptions = {
        preset: require.resolve('cssnano-preset-simple'),
      },
    }
  }
};
```
