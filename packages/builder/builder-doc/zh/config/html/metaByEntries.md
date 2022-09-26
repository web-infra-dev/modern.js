- Type: `Record<string, Meta>`
- Default: `undefined`

用于在多页面的场景下，为不同的页面设置不同的 meta 标签。

整体用法与 `meta` 一致，并且可以使用「入口名称」作为 key ，对各个页面进行单独设置。

`metaByEntries` 的优先级高于 `meta`，因此会覆盖 `meta` 中设置的值。

#### 示例

```js
export default {
  html: {
    meta: {
      description: 'ByteDance',
    },
    metaByEntries: {
      foo: {
        description: 'Tiktok',
      },
    },
  },
};
```

编译后，可以看到页面 `foo` 的 meta 为：

```html
<meta name="description" content="Tiktok" />
```

其他页面的 meta 为：

```html
<meta name="description" content="ByteDance" />
```
