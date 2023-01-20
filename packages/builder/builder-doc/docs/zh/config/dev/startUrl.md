- **类型：** `boolean | string | string[] | undefined`
- **默认值：** `undefined`

`dev.startUrl` 用于设置 Dev Server 启动时自动在浏览器中打开的页面 URL。

默认情况下，Dev Server 启动时不会打开任何页面。

你可以设置为如下的值：

```js
export default {
  dev: {
    // 打开项目的默认页面，等价于 `http://localhost:<port>`
    startUrl: true,
    // 打开指定的页面
    startUrl: 'http://localhost:8080',
    // 打开多个页面
    startUrl: ['http://localhost:8080', 'http://localhost:8080/about'],
  },
};
```

## 端口号占位符

由于端口号可能会发生变动，你可以使用 `<port>` 占位符来指代当前端口号，Builder 会自动将占位符替换为实际监听的端口号。

```js
export default {
  dev: {
    startUrl: 'http://localhost:<port>/home',
  },
};
```
