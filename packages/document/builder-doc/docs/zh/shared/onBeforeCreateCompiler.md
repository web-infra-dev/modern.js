`onBeforeCreateCompiler` 是在创建底层 Compiler 实例前触发的回调函数，当你执行 `builder.startDevServer`、`builder.build` 或 `builder.createCompiler` 时，都会调用此钩子。

你可以通过 `bundlerConfigs` 参数获取到底层打包工具的最终配置数组：

- 如果当前打包工具为 webpack，则获取到的是 webpack 配置数组。
- 如果当前打包工具为 Rspack，则获取到的是 Rspack 配置数组。
- 配置数组中可能包含一份或多份配置，这取决于你是否开启了 SSR 等功能。

你可以通过 `bundlerConfigs` 参数获取到底层打包工具的最终配置对象。

- **类型**

```ts
function OnBeforeCreateCompiler(
  callback: (params: {
    bundlerConfigs: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
