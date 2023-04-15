- **类型：** `string`
- **默认值：** `0.0.0.0`

指定 dev server 启动时监听的 host。

默认情况下，dev server 会监听 `0.0.0.0`，这代表监听所有的网络接口，包括 `localhost` 和公网地址。

如果你希望 dev server 只监听 `localhost`，可以设置为：

```ts
export default {
  dev: {
    host: 'localhost',
  },
};
```
