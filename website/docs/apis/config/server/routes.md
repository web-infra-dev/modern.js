---
sidebar_label: routes
sidebar_position: 4
---

# server.routes

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： 根据文件约定自动生成的服务端路由规则：应用的每个入口生成一条路由规则，入口名称等于路由名称。

该配置选项只作用于服务端路由，可以自定义应用入口的访问路由。

对象的 `key` 为当前应用的入口名, 值可以是 `string | Array<string>`。

当值类型为 `string` 时，当前值即表示访问该入口的路由名称。

```js title="modern.config.js"
export default defineConfig({
  server: {
    routes: {
      // 默认路由为 /entryName1，自定义后为 /p/test1
      entryName1: '/p/test1'
      // 支持动态服务端路由配置
      entryName2: '/detail/:id'
    }
  }
});
```

也可以通过 `Array<string>` 为入口设置多个访问路由:

```js title="modern.config.js"
export default defineConfig({
  server: {
    routes: {
      'page-a': [`/a`, '/b'],
    },
  },
});
```

此时，通过 `/a`、`/b` 两个路由都可以访问到 `page-a` 入口。

执行 `dev` 命令后，可以在 `dist/route.json` 中查看入口 `page-a` 存在两条路由记录:

```json
{
  "routes": [
    {
      "urlPath": "/a",
      "entryName": "page-a",
      "entryPath": "html/page-a/index.html",
      "isSPA": true,
      "isSSR": false,
      "enableModernMode": false
    },
    {
      "urlPath": "/b",
      "entryName": "page-a",
      "entryPath": "html/page-a/index.html",
      "isSPA": true,
      "isSSR": false,
      "enableModernMode": false
    },
  ]
}
```


