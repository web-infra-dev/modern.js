- **类型：** `string`
- **默认值：** `'root'`

默认情况下，HTML 模板中包含了 `root` 节点用于组件挂载，通过 `mountId` 可以修改该节点的 id。

```html
<body>
  <div id="root"></div>
</body>
```

### 示例

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

### 注意事项

#### 更新相关代码

在修改 `mountId` 后，如果你的代码中有获取 `root` 根节点的逻辑，请更新对应的值：

```diff
- const domNode = document.getElementById('root');
+ const domNode = document.getElementById('app');

ReactDOM.createRoot(domNode).render(<App />);
```

#### 自定义模板

如果你自定义了 HTML 模板，请确保模板中包含 `<div id="<%= mountId %>"></div>`，否则 `mountId` 配置项无法生效。
