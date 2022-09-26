- Type: `Object | Function`
- Default

```js
{
  flexbox: 'no-2009',
  // Depends on the browserslist config in the project and the `output.overrideBrowserslist` (higher priority) config
  overrideBrowserslist: browserslist,
}
```

You can modify the config of [autoprefixer](https://github.com/postcss/autoprefixer) by `tools.autoprefixer`.

### Type

#### Object

When `tools.autoprefixer` is configured as `Object` type, it is merged with the default config through Object.assign. For example:

```js
export default {
  tools: {
    autoprefixer: {
      flexbox: 'no-2009',
    },
  },
};
```

#### Function

When `tools.autoprefixer` is of Function type, the default config is passed as the first parameter and can be directly modified or returned as the final result. For example:

```js
export default {
  tools: {
    autoprefixer(config) {
      // modify flexbox config
      config.flexbox = 'no-2009';
    },
  },
};
```
