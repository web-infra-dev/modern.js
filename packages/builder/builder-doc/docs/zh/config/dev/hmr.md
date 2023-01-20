- **Type:** `boolean`
- **Default:** `true`

是否开启 Hot Module Replacement 热更新能力。

当 `hmr` 设置为 `false` 时，将不再提供热更新和 react-refresh 功能。

```js
export default {
  dev: {
    hmr: false,
  },
};
```
