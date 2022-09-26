- Type: `Object | Function | false`
- Default: `Object`

By default, the [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) is enabled for type checking. You can:

- Configure as `Object` or `Function` to modify the default config.
- Configure to `false` to turn off type checking for `fork-ts-checker-webpack-plugin`.

The default config is as follows:

> In most cases you don't need to modify the default `tools.tsChecker` config.

```js
{
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

### Type

#### Object

When this value is of type Object, it is merged with the default config via Object.assign.

#### Function

When the value is of type Function, the default config is passed in as the first parameter. You can modify the config object directly, or return an object as the final config.
