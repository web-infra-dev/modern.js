在执行生产环境构建前调用，你可以通过 `bundlerConfigs` 参数获取到底层打包工具的最终配置对象。

- **Type**

```ts
function OnBeforeBuild(
  callback: (params: {
    bundlerConfigs?: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
