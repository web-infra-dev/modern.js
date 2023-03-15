Called after creating a compiler instance, before executing a build, when you execute `builder.startDevServer`, `builder.build` or `builder.createCompiler`, this hook will be called. You can get the compiler instance through the `compiler` parameter.

- **Type**

```ts
function OnAfterCreateCompiler(callback: (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;): void;
```
