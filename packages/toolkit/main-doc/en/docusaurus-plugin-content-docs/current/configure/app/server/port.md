---
sidebar_label: port
---

# server.port

- Type: `number`
- Default: `8080`

Modern.js's default port is `8080`, when using the `dev`, `start` or `serve` command. You can change the port number using this configuration:

```js title="modern.config.ts"
export default defineConfig({
  server: {
    port: 3000,
  },
});
```
