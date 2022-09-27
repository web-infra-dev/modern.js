- Type: `Object | Function`
- Default

```js
{
  lessOptions: {
    javascriptEnabled: true
  },
  sourceMap: false,
}
```

You can modify the config of [less-loader](https://github.com/webpack-contrib/less-loader) via `tools.less`.

### Type

#### Object

When `tools.less` is configured as `Object` type, it is merged with the default config through Object.assign. For example:

```js
export default {
  tools: {
    less: {
      lessOptions: {
        javascriptEnabled: false
      },
    },
  },
};
```

#### Function

When `tools.less` is Function type, the default config is passed as the first parameter, which can be directly modified or returned as the final result. The second parameter provides some utility functions that can be called directly. For example:

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

Used to specify which files `less-loader` does not compile, for example:

```js
export default {
  tools: {
    less(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
