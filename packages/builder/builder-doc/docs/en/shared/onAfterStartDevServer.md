Called after starting the development server, you can get the port number through the `port` parameter.

- **Type**

```ts
function OnAfterStartDevServer(
  callback: (params: { port: number }) => Promise<void> | void,
): void;
```
