- **类型：** `() => Promise<void> | void`
- **默认值：** `undefined`

`dev.beforeStartUrl` 用于在打开 `startUrl` 前执行一段回调函数，该配置项需要与 `dev.startUrl` 一同使用。

```js
export default {
  dev: {
    startUrl: true,
    beforeStartUrl: async () => {
      await doSomeThing();
    },
  },
};
```
