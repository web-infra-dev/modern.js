---
sidebar_label: baseUrl
---

# server.baseUrl

- Type: `string | string[]`
- Default: `undefined`

Uniformly set the server-level routing prefix (often used in the case of shared domain names to distinguish traffic).

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    // 所有生成的路由前面都会自动加上前缀 `/base`
    // 生成的服务端路由文件路径：dist/route.json
    baseUrl: '/base'

    // 多 baseUrl
    baseUrl: ['/base-new', '/base-old']
  }
})
```

After `dev`, you can see that the routed access will be prefixed accordingly:

```bash
App running at:

  > Local:    http://localhost:8080/base/
  > Network:  http://192.168.0.1:8080/base/
```
