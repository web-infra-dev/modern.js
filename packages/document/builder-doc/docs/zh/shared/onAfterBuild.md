`onAfterBuild` 是在执行生产环境构建后触发的回调函数，你可以通过 `stats` 参数获取到构建结果信息：

- 如果当前打包工具为 webpack，则获取到的是 webpack Stats。
- 如果当前打包工具为 Rspack，则获取到的是 Rspack Stats。

- **类型**

```ts
function OnAfterBuild(
  callback: (params: { stats?: Stats | MultiStats }) => Promise<void> | void,
): void;
```
