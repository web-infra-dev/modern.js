- Type: `Record<string, string>`
- Default: `undefined`

用于在多页面的场景下，为不同的页面设置不同的 `title`。

整体用法与 `title` 一致，并且可以使用「入口名称」作为 key ，对各个页面进行单独设置。

`titleByEntries` 的优先级高于 `title`，因此会覆盖 `title` 中设置的值。

#### 示例

```js
export default {
  html: {
    title: 'ByteDance',
    titleByEntries: {
      foo: 'Tiktok',
    },
  },
};
```


重新编译后，可以看到:

- 页面 `foo` 的 title 为 `Tiktok`。
- 其他页面的 title 为 `ByteDance`。
