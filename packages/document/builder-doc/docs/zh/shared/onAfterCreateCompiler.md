`onAfterCreateCompiler` 是在创建 Compiler 实例后、执行构建前触发的回调函数，当你执行 `builder.startDevServer`、`builder.build` 或 `builder.createCompiler` 时，都会调用此钩子。

你可以通过 `compiler` 参数获取到 Compiler 实例对象:

- 如果当前打包工具为 webpack，则获取到的是 webpack Compiler 对象。
- 如果当前打包工具为 Rspack，则获取到的是 Rspack Compiler 对象。

- **类型**

```ts
function OnAfterCreateCompiler(callback: (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;): void;
```
