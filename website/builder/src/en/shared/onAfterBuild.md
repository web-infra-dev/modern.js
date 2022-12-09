Called after executing the production build, you can get the build result information through the `stats` parameter.

- **Type**

```ts
function OnAfterBuild(
  callback: (params: { stats?: Stats | MultiStats }) => Promise<void> | void,
): void;
```
