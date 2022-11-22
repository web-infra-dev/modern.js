- Type: `Record<string, false | string | Record<string, string | boolean>>`
- Default: `undefined`

配置 HTML 页面的 `<meta>` 标签。

#### 字符串用法

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

#### 对象用法

当 `meta` 对象的 `value` 为对象时，会将该对象的 `key: value` 映射为 `meta` 标签的属性。

这种情况下默认不会设置 `name` 和 `content` 属性。

比如设置 `http-equiv`：

```js
export default {
  html: {
    meta: {
      'http-equiv': {
        'http-equiv': 'x-ua-compatible',
        content: 'ie=edge',
      },
    },
  },
};
```

最终在 HTML 中生成的 `meta` 标签为：

```html
<meta http-equiv="x-ua-compatible" content="ie=edge" />
```

### 移除默认值

将 `meta` 对象的 `value` 设置为 `false`，则表示不生成对应的 meta 标签。

比如移除框架预设的 `imagemode`：

```ts
export default {
  html: {
    meta: {
      imagemode: false,
    },
  },
};
```
