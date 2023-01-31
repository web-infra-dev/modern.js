- **Type:** `Object | Function`
- **Default:**

```js
const defaultOptions = {
  lessOptions: {
    javascriptEnabled: true,
  },
  // CSS Source Map enabled by default in development environment
  sourceMap: isDev,
};
```

You can modify the config of [less-loader](https://github.com/webpack-contrib/less-loader) via `tools.less`.

### Object Type

When `tools.less` is configured as `Object` type, it is merged with the default config through Object.assign in a shallow way. It should be noted that `lessOptions` is merged through deepMerge in a deep way. For example:

```js
export default {
  tools: {
    less: {
      lessOptions: {
        javascriptEnabled: false,
      },
    },
  },
};
```

### Function Type

When `tools.less` is a Function, the default config is passed as the first parameter, which can be directly modified or returned as the final result. The second parameter provides some utility functions that can be called directly. For example:

```js
export default {
  tools: {
    less(config) {
      // Modify the config of lessOptions
      config.lessOptions = {
        javascriptEnabled: false,
      };
    },
  },
};
```

### Util Function

#### addExcludes

- **Type:** `(excludes: RegExp | RegExp[]) => void`

Used to specify which files `less-loader` does not compile, You can pass in one or more regular expressions to match the path of less files, for example:

```js
export default {
  tools: {
    less(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
