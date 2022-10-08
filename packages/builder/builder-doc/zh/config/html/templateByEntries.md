- Type: `Object`
- Default: `undefined`

用于在多页面的场景下，为不同的页面设置不同的 HTML 模板。

整体用法与 `template` 一致，并且可以使用「入口名称」作为 key ，对各个页面进行单独设置。

`templateByEntries` 的优先级高于 `template`，因此会覆盖 `template` 设置的值。

#### 示例

```js
export default {
  output: {
    template: './static/index.html',
    templateByEntries: {
      foo: './src/pages/foo/index.html',
      bar: './src/pages/bar/index.html',
    },
  },
};
```
