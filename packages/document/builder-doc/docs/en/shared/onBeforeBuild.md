Called before executing the production environment build, you can get the final config object of the bundler through the `bundlerConfigs` parameter.

- **Type**

```ts
function OnBeforeBuild(
  callback: (params: {
    bundlerConfigs?: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
