`onAfterCreateCompiler` is a callback function that is triggered after the compiler instance has been created, but before the build process. This hook is called when you run `builder.startDevServer`, `builder.build`, or `builder.createCompiler`.

You can access the Compiler instance object through the `compiler` parameter:

- If the current bundler is webpack, you will get the webpack Compiler object.
- If the current bundler is Rspack, you will get the Rspack Compiler object.

- **Type**

```ts
function OnAfterCreateCompiler(callback: (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;): void;
```
