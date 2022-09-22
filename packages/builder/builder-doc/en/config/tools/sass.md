<<<<<<< HEAD
- Type: `Object | Function`
=======
- Type: `Object` | `Function`
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
- Default

```js
{
<<<<<<< HEAD
  sourceMap: false;
=======
  sourceMap: false
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
}
```

You can modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader) via `tools.sass`.

<<<<<<< HEAD
### Object Type

When `tools.sass` is `Object` type, it is merged with the default config via Object.assign. For example:
=======
### Type

#### Object

When `tools.sass` is configured as an `Object` type, it is merged with the default config via Object.assign. For example:
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))

```js
export default {
  tools: {
    sass: {
      sourceMap: true,
    },
  },
};
```

<<<<<<< HEAD
### Function Type
=======
#### Function
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))

When `tools.sass` is Function type, the default config is passed as the first parameter, which can be directly modified or returned as the final result. The second parameter provides some utility functions that can be called directly. For Example:

```js
export default {
  tools: {
    sass(config) {
      // Modify sourceMap config
<<<<<<< HEAD
      config.additionalData = async (content, loaderContext) => {
=======
      config.additionalData = async (content,loaderContext) => {
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
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
