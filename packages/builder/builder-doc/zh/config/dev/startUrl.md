- Type: `boolean | string | string[] | undefined`
- Default: `undefined`

`dev.startUrl` 用来设置 Dev Server 启动时自动打开的页面 URL，默认情况下不会打开任何页面。

你可以设置为如下的值：

```js
export default {
  dev: {
    // 打开项目的默认页面
    startUrl: true,
    // 打开指定的页面
    startUrl: 'http://localhost:8080',
    // 打开多个页面
    startUrl: ['http://localhost:8080', 'http://localhost:8080/about'],
  },
};
```
