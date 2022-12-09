在创建 compiler 实例前调用，当你执行 `builder.startDevServer`、`builder.build` 或 `builder.createCompiler` 时，都会调用此钩子。你可以通过 `bundlerConfigs` 参数获取到底层打包工具的最终配置对象。

- **Type**

```ts
function OnBeforeCreateCompiler(
  callback: (params: {
    bundlerConfigs: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
