- Type: `Record<string, ArrayOrNot<HtmlInjectTag | HtmlInjectTagHandler>>`
- Default: `undefined`

用于在多页面的场景下，为不同的页面注入不同的标签。

整体用法与 `tags` 一致，并且可以使用「入口名称」作为 key ，对各个页面进行单独设置。

`tagsByEntries` 的优先级高于 `tags`，因此会覆盖 `tags` 中设置的值。

#### 示例

```js
export default {
  html: {
    tags: [
      { tag: 'script', attrs: { src: 'a.js' } }
    ],
    tagsByEntries: {
      foo: [
        { tag: 'script', attrs: { src: 'b.js' } }
      ],
    },
  },
};
```

编译后，可以看到页面 `foo` 注入标签：

```html
<script src="b.js"></script>
```

其他页面则注入了：

```html
<script src="a.js"></script>
```
