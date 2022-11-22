- Type: `string`
- Default: `'root'`

默认情况下，HTML 模板中包含了 `root` 节点用于组件挂载，通过 `mountId` 可以修改该节点的 id。

```html
<body>
  <div id="root"></div>
</body>
```

#### 示例

修改 DOM 挂载节点 `id` 为 `app`：

```js
export default {
  html: {
    mountId: 'app',
  },
};
```

编译后：

```html
<body>
  <div id="app"></div>
</body>
```

:::tip
如果自定义了 HTML 模板，请确保模板中包含 `<div id="<%= mountId %>"></div>`，否则该配置项无法生效。
:::
