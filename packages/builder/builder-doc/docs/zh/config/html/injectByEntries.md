- Type: `Record<string, boolean | string>`
- Default: `undefined`

用于在多页面的场景下，为不同的页面设置不同的 script 标签插入位置。

整体用法与 `inject` 一致，并且可以使用「入口名称」作为 key ，对各个页面进行单独设置。

`injectByEntries` 的优先级高于 `inject`，因此会覆盖 `inject` 中设置的值。

#### 示例

```js
export default {
  html: {
    inject: 'head',
    injectByEntries: {
      foo: 'body',
    },
  },
};
```

重新编译后，可以看到:

- 页面 `foo` 的 script 标签会插入到 `body` 标签内。
- 其他页面的 script 标签会插入到 `head` 标签内。
