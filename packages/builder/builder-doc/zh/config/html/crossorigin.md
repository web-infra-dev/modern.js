- Type: `boolean | 'anonymous' | 'use-credentials'`
- Default: `false`

用于设置 `<script>` 标签的 [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) 属性。

传入 true 时，会自动设置为 `crossorigin="anonymous"`。

#### 示例

```js
export default {
  html: {
    crossorigin: 'anonymous',
  },
};
```

编译后，HTML 中的 `<script>` 标签变为：

```html
<script defer src="/static/js/main.js" crossorigin="anonymous"></script>
```
