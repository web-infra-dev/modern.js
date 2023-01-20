在创建 compiler 实例后、执行构建前调用，当你执行 `builder.startDevServer`、`builder.build` 或 `builder.createCompiler` 时，都会调用此钩子。你可以通过 `compiler` 参数获取到 compiler 实例对象。

- **类型**

```ts
function OnAfterCreateCompiler(callback: (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;): void;
```
