在启动开发服务器后调用，你可以通过 `port` 参数获得开发服务器监听的端口号。

- **类型**

```ts
function OnAfterStartDevServer(
  callback: (params: { port: number }) => Promise<void> | void,
): void;
```
