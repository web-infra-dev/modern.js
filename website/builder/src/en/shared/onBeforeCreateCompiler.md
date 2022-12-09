Called before creating the compiler instance, when you execute `builder.startDevServer`, `builder.build` or `builder.createCompiler`, this hook will be called. You can get the final config object of the bundler through the `bundlerConfigs` parameter.

- **Type**

```ts
function OnBeforeCreateCompiler(
  callback: (params: {
    bundlerConfigs: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
