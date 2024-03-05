- **类型：** `Object`
- **默认值：** `undefined`

用于在多页面的场景下，为不同的页面设置不同的模板参数。

整体用法与 `templateParameters` 一致，并且可以使用「入口名称」作为 key ，对各个页面进行单独设置。

`templateParametersByEntries` 的优先级高于 `templateParameters`，因此会覆盖 `templateParameters` 中设置的值。

:::warning
**Deprecated**：该配置已废弃，请使用 `templateParameters` 的函数用法代替。
:::

### 示例

```js
export default {
  html: {
    templateParametersByEntries: {
      foo: {
        type: 'a',
      },
      bar: {
        type: 'b',
      },
    },
  },
};
```
