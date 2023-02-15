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
- **打包工具：** `仅支持 webpack`

默认情况下，Builder 会开启 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) 进行类型检查。你可以通过 `output.disableTsChecker` 配置项来关闭类型检查。

### Object 类型

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。

### Function 类型

当此值为 Function 类型时，默认配置作为第一个参数传入，你可以直接修改配置对象，也可以返回一个对象作为最终配置。
