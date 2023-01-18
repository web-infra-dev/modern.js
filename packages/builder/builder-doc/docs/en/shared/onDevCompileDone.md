Called after each development environment build, you can use `isFirstCompile` to determine whether it is the first build.

- **Type**

```ts
function OnDevCompileDone(
  callback: (params: { isFirstCompile: boolean }) => Promise<void> | void,
): void;
```
