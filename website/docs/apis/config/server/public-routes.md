---
sidebar_label: publicRoutes
sidebar_position: 4
---

# server.publicRoutes

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： 根据文件约定自动生成的服务端路由规则：应用的每个文件生成一条路由规则。

该配置选项只作用于服务端路由，可以自定义 `config/public/` 下资源的访问路由。

对象的 `key` 为当前应用的相对文件路径（不使用 `./`）, 值可以是 `string`。

```js title="modern.config.js"
export default defineConfig({
  server: {
    publicRoutes: {
      // 设置一个长路由
      'index.json': '/user-config/card-info/extra/help.json',

      // 设置一个不带后缀的路由
      'robot.txt': '/app/authentication'
    }
  }
});
```
