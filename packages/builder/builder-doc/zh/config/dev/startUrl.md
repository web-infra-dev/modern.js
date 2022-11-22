- Type: `boolean | string | string[] | undefined`
- Default: `undefined`

`dev.startUrl` 用来设置启动时打开的页面，默认情况下不开启。你可以设置为如下的值：

```js
export default {
  dev: {
    // 默认打开项目预览页面
    startUrl: true,
    // 打开指定的页面
    startUrl: 'http://localhost:8080',
    // 打开多个页面
    startUrl: ['http://localhost:8080', 'http://localhost:8080/about'],
  },
};
```
