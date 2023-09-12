- **Type:** `Object | Function`
- **Default:**

```js
const defaultOptions = {
  // CSS Source Map enabled by default in development environment
  sourceMap: isDev,
};
```

You can modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader) via `tools.sass`.

### Object Type

When `tools.sass` is `Object` type, it is merged with the default config through Object.assign. It should be noted that `sassOptions` is merged through deepMerge in a deep way.

For example:

```js
export default {
  tools: {
    sass: {
      sourceMap: true,
    },
  },
};
```

### Function Type

When `tools.sass` is a Function, the default config is passed as the first parameter, which can be directly modified or returned as the final result. The second parameter provides some utility functions that can be called directly. For Example:

```js
export default {
  tools: {
    sass(config) {
      // Modify sourceMap config
      config.additionalData = async (content, loaderContext) => {
        // ...
      };
    },
  },
};
```

### Modifying Sass Version

In some scenarios, if you need to use a specific version of Sass instead of the built-in Dart Sass v1 in Builder, you can install the desired Sass version in your project and set it up using the `implementation` option of the `sass-loader`.

```js
export default {
  tools: {
    sass: {
      implementation: require('sass'),
    },
  },
};
```

### Utility Function

#### addExcludes

- **Type:** `(excludes: RegExp | RegExp[]) => void`

Used to specify which files `sass-loader` does not compile, You can pass in one or more regular expressions to match the path of sass files, for example:

```js
export default {
  tools: {
    sass(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
