---
sidebar_label: prefix
sidebar_position: 1
---

# bff.prefix



* 类型：`string`
* 默认值：`/api`

:::caution 注意
应用工程需要请确保使用【[new](/docs/apis/app/commands/new)】 启用了 BFF 功能。
:::

默认情况下，BFF API 目录下的路由访问前缀是 `/api`, 如下目录结构：

```bash
api
└── hello.ts
```

`api/hello.ts` 访问时对应的路由为 `localhost:8080/api/hello`。


该配置选项可以修改默认的路由前缀：

```js title="modern.config.js"
export default defineConfig({
  bff: {
    prefix: '/api-demo'
  }
})
```

对应的 `api/hello.ts` 访问路由为 `localhost:8080/api-demo/hello`。

