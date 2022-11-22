---
sidebar_label: publicRoutes
---

# server.publicRoutes

* Type: `Object`
* Default: Automatic generation of server-level routing rules based on file conventions: One routing rule is generated per file of the application.

This configuration option only applies to server-level routing, and you can customize the access route of resources in `config/public/`.

The `key` of the object is the relative file path of the current application (not used `./`）, value can be `string`.

```typescript title="modern.config.ts"
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
