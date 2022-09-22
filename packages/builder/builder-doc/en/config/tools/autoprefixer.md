<<<<<<< HEAD
- Type: `Object | Function`
=======
- Type: `Object` | `Function`
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
- Default

```js
{
  flexbox: 'no-2009',
<<<<<<< HEAD
  // Depends on the browserslist config in the project
  // and the `output.overrideBrowserslist` (higher priority) config
=======
  // Depends on the browserslist config in the project and the `output.overrideBrowserslist` (higher priority) config
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
  overrideBrowserslist: browserslist,
}
```

You can modify the config of [autoprefixer](https://github.com/postcss/autoprefixer) by `tools.autoprefixer`.

<<<<<<< HEAD
### Object Type
=======
### Type

#### Object
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))

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

<<<<<<< HEAD
### Function Type
=======
#### Function
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))

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
