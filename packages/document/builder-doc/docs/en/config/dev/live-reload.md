- **Type:** `boolean`
- **Default:** `true`

Whether to reload the page when source files are changed.

By default, Modern.js uses HMR as the preferred method to update modules. If HMR is disabled or cannot be used in certain scenarios, it will automatically fallback to liveReload.

## Disabling liveReload

If you need to disable liveReload, you can set both `dev.hmr` and `dev.liveReload` to `false`. Then, no Web Socket requests will be made to the dev server on the page, and the page will not automatically refresh when file change.

```js
export default {
  dev: {
    hmr: false,
    liveReload: false,
  },
};
```
