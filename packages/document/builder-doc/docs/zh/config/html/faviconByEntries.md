- **类型：** `Record<string, string>`
- **默认值：** `undefined`

用于在多页面的场景下，为不同的页面设置不同的 favicon。

整体用法与 `favicon` 一致，并且可以使用「入口名称」作为 key ，对各个页面进行单独设置。

`faviconByEntries` 的优先级高于 `favicon`，因此会覆盖 `favicon` 中设置的值。

:::warning
**Deprecated**：该配置已废弃，请使用 `favicon` 的函数用法代替。
:::

### 示例

```js
export default {
  html: {
    favicon: './src/assets/default.png',
    faviconByEntries: {
      foo: './src/assets/foo.png',
    },
  },
};
```

重新编译后，可以看到:

- 页面 `foo` 的 favicon 为 `./src/assets/foo.png`。
- 其他页面的 favicon 为 `./src/assets/default.png`。
