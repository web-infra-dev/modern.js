- **Type:** `string`
- **Default:** `0.0.0.0`

Specify the host that the dev server listens to.

By default, the dev server will listen to `0.0.0.0`, which means listening to all network interfaces, including `localhost` and public network addresses.

If you want the dev server to listen only on `localhost`, you can set it to:

```ts
export default {
  dev: {
    host: 'localhost',
  },
};
```
