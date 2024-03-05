- **类型：** `Object | Function`
- **默认值：** `undefined`

配置 HTML 页面的 `<meta>` 标签。

### 示例

当 `meta` 对象的 `value` 为字符串时，会自动将对象的 `key` 映射为 `name`，`value` 映射为 `content`。

比如设置 `description`：

```js
export default {
  html: {
    meta: {
      description: 'a description of the page',
    },
  },
};
```

最终在 HTML 中生成的 `meta` 标签为：

```html
<meta name="description" content="a description of the page" />
```

详细用法可参考 [Rsbuild - html.meta](https://rsbuild.dev/zh/config/html/meta)。
