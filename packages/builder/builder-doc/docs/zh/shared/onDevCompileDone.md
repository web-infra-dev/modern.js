在每次开发环境构建结束后调用，你可以通过 `isFirstCompile` 来判断是否为首次构建。

- **Type**

```ts
function OnDevCompileDone(
  callback: (params: { isFirstCompile: boolean }) => Promise<void> | void,
): void;
```
