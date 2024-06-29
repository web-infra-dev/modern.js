- **类型：** `boolean`
- **默认值：** `true`

是否在源文件变更时自动刷新页面。

默认情况下，Modern.js 会优先使用 HMR 来更新模块。当 HMR 功能被禁用，或者某些场景 HMR 无法生效时，会自动降级到 liveReload。

## 禁用 liveReload

如果你需要禁用 liveReload，可以将 `dev.hmr` 和 `dev.liveReload` 同时设置为 `false`，此时页面上不会发起 Web Socket 请求到 dev server，也不会在文件变更时自动刷新页面。

```js
export default {
  dev: {
    hmr: false,
    liveReload: false,
  },
};
```
