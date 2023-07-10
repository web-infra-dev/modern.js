`onBeforeBuild` is a callback function that is triggered before the production build is executed. You can access the final configuration array of the underlying bundler through the `bundlerConfigs' parameter:

- If the current bundler is webpack, you will get a webpack configuration array.
- If the current bundler is Rspack, you will get an Rspack configuration array.
- The configuration array can contain one or more configurations, depending on the current `target` config of Builder.

- **Type**

```ts
function OnBeforeBuild(
  callback: (params: {
    bundlerConfigs?: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
