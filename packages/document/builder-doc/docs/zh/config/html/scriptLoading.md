- **类型：** `'defer' | 'blocking' | 'module'`
- **默认值：** `'defer'`

用于设置 `<script>` 标签的加载方式。

### defer

默认情况下，Builder 生成的 `<script>` 标签会自动设置 `defer` 属性，以避免阻塞页面的解析和渲染。

```html
<head>
  <script defer src="/static/js/main.js"></script>
</head>
<body></body>
```

:::tip
当浏览器遇到带有 defer 属性的 `<script>` 标签时，它会异步地下载脚本文件，不会阻塞页面的解析和渲染。在页面解析和渲染完成后，浏览器会按照 `<script>` 标签在文档中出现的顺序依次执行它们。
:::

### blocking

将 `scriptLoading` 设置为 `blocking` 可以移除 `defer` 属性，此时脚本是同步执行的，这意味着它会阻塞浏览器的解析和渲染过程，直到脚本文件被下载并执行完毕。

```js
export default {
  html: {
    inject: 'body',
    scriptLoading: 'blocking',
  },
};
```

当你需要设置 `blocking` 时，建议把 `html.inject` 设置为 `body`，避免页面渲染被阻塞。

```html
<head></head>
<body>
  <script src="/static/js/main.js"></script>
</body>
```

### module

将 `scriptLoading` 设置为 `module` 时，可以让脚本支持 ESModule 语法，同时浏览器也会自动默认延迟执行这些脚本，效果与 `defer` 类似。

```js
export default {
  html: {
    scriptLoading: 'module',
  },
};
```

```html
<head>
  <script type="module" src="/static/js/main.js"></script>
</head>
<body></body>
```
