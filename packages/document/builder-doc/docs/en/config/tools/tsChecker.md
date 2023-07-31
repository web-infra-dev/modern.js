- **Type:** `Object | Function`
- **Default:**

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

When the value of `tsChecker` is of type Object, it will be deeply merged with the default configuration.

```ts
export default {
  tools: {
    tsChecker: {
      issue: {
        exclude: [{ file: '**/some-folder/**/*.ts' }],
      },
    },
  },
};
```

### Function Type

When the value of `tsChecker` is of type Function, the default configuration will be passed as the first argument. You can directly modify the configuration object or return an object as the final configuration.

```ts
export default {
  tools: {
    tsChecker(options) {
      (options?.issue?.exclude as unknown[]).push({
        file: '**/some-folder/**/*.ts',
      });
    },
  },
};
```
