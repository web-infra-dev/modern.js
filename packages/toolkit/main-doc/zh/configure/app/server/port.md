---
sidebar_label: port
---

# server.port

- 类型： `number`
- 默认值： `8080`

Modern.js 在执行 `dev`, `start` 和 `serve` 命令时，会以 `8080` 为默认端口启动，通过该配置可以修改 Server 启动的端口号：

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    port: 3000,
  },
});
```
