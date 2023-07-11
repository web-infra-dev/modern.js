`onBeforeBuild` 是在执行生产环境构建前触发的回调函数，你可以通过 `bundlerConfigs` 参数获取到底层打包工具的最终配置数组：

- 如果当前打包工具为 webpack，则获取到的是 webpack 配置数组。
- 如果当前打包工具为 Rspack，则获取到的是 Rspack 配置数组。
- 配置数组中可能包含一份或多份配置，这取决于 Builder 当前 target 配置的值。

- **类型**

```ts
function OnBeforeBuild(
  callback: (params: {
    bundlerConfigs?: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
