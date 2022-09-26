- Type: `Object | Function`
- Default

```js
{
  sourceMap: false
}
```

You can modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader) via `tools.sass`.

### Type

#### Object

When `tools.sass` is configured as an `Object` type, it is merged with the default config via Object.assign. For example:

```js
export default {
  tools: {
    sass: {
      sourceMap: true,
    },
  },
};
```

#### Function

When `tools.sass` is Function type, the default config is passed as the first parameter, which can be directly modified or returned as the final result. The second parameter provides some utility functions that can be called directly. For Example:

```js
export default {
  tools: {
    sass(config) {
      // Modify sourceMap config
      config.additionalData = async (content,loaderContext) => {
        // ...
      };
    },
  },
};
```

### Utility Function

#### addExcludes

Used to specify which files `sass-loader` does not compile, for example:

```js
export default {
  tools: {
    sass(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
