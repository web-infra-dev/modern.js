- **Type:** `() => Promise<void> | void`
- **Default:** `undefined`

`dev.beforeStartUrl` is used to execute a callback function before opening the `startUrl`, this config needs to be used together with `dev.startUrl`.

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
