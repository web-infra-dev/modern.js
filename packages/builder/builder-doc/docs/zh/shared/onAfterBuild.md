在执行生产环境构建后调用，你可以通过 `stats` 参数获取到构建结果信息。

- **Type**

```ts
function OnAfterBuild(
  callback: (params: { stats?: Stats | MultiStats }) => Promise<void> | void,
): void;
```
