`onAfterBuild` is a callback function that is triggered after running the production build. You can access the build result information via the `stats' parameter:

- If the current bundler is webpack, you will get webpack Stats.
- If the current bundler is Rspack, you will get Rspack Stats.

- **Type**

```ts
function OnAfterBuild(
  callback: (params: { stats?: Stats | MultiStats }) => Promise<void> | void,
): void;
```
