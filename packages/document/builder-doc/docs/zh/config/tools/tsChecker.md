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

默认情况下，Modern.js 会开启 [@rsbuild/plugin-type-check](https://rsbuild.dev/zh/plugins/list/plugin-type-check) 进行类型检查。你可以通过 `output.disableTsChecker` 配置项来关闭类型检查。

## 示例

当 `tsChecker` 的值为 Object 类型时，会与默认配置进行深层合并。

```ts
export default {
  tools: {
    tsChecker: {
      issue: {
        exclude: [({ file = '' }) => /[\\/]some-folder[\\/]/.test(file)],
      },
    },
  },
};
```

> 请参考 [@rsbuild/plugin-type-check](https://rsbuild.dev/zh/plugins/list/plugin-type-check) 了解更多用法。
