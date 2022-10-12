- Type: `Object | Function | false`
- Default: `Object`

默认情况下，开启 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) 进行类型检查，你可以通过:

- 配置为 `Object` 或者 `Function` 修改默认配置；
- 配置为 `false` 以关闭 `fork-ts-checker-webpack-plugin` 的类型检查。

默认配置如下:

> 大多数情况下你不需要修改 `tools.tsChecker` 默认配置。

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

### 类型

#### Object

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。

#### Function

当此值为 Function 类型时，默认配置作为第一个参数传入，你可以直接修改配置对象，也可以返回一个对象作为最终配置。
