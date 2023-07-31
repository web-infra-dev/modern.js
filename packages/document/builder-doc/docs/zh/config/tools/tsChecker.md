- **类型：** `Object | Function`
- **默认值：**

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

默认情况下，Builder 会开启 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) 进行类型检查。你可以通过 `output.disableTsChecker` 配置项来关闭类型检查。

### Object 类型

当 `tsChecker` 的值为 Object 类型时，会与默认配置进行深层合并。

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

### Function 类型

当 `tsChecker` 的值为 Function 类型时，默认配置会作为第一个参数传入，你可以直接修改配置对象，也可以返回一个对象作为最终配置。

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
