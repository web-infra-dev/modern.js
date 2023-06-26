- **类型：** `boolean | 'anonymous' | 'use-credentials'`
- **默认值：** `false`

用于设置 `<script>` 和 `<style>` 标签的 [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) 属性。

- 当传入 `true` 时，它会被自动设置为 `crossorigin="anonymous"`。
- 当传入 `false` 时，它不会设置 `crossorigin` 属性。

### 示例

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

`<style>` 标签变为：

```html
<link href="/static/css/main.css" rel="stylesheet" crossorigin="anonymous" />
```

### 可选值

`crossorigin` 可以被设置为以下几个值：

- `anonymous`：请求使用 CORS 头，并将证书标志设置为 "same-origin"。除非目标是相同的 origin，否则不会通过 cookie、客户端 SSL 证书或 HTTP 身份验证交换用户凭据。
- `use-credentials`：请求使用 CORS 头，证书标志设置为 "include"，并始终包含用户凭据。
