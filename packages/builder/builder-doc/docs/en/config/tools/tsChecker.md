- Type: `Object | Function`
- Default:

```js
const defaultOptions = {
  typescript: {
    // avoid OOM issue
    memoryLimit: 8192,
    // use tsconfig of user project
    configFile: tsconfigPath,
    // use typescript of user project
    typescriptPath: require.resolve('typescript'),
  },
  issue: {
    exclude: [
      { file: '**/*.(spec|test).ts' },
      { file: '**/node_modules/**/*' },
    ],
  },
  logger: {
    log() {
      // do nothing
      // we only want to display error messages
    },
    error(message: string) {
      console.error(message.replace(/ERROR/g, 'Type Error'));
    },
  },
},
```

By default, the [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) is enabled for type checking. You can use `output.disableTsChecker` config to disable it.

### Object Type

When this value is an Object, it is merged with the default config via Object.assign.

### Function Type

When the value is a Function, the default config is passed in as the first parameter. You can modify the config object directly, or return an object as the final config.
