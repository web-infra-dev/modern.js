---
sidebar_label: port
---

# server.port

* Type: `Number`
* Default: `8080`

Modern.js' default port is '8080', when using the `dev` or `start` command. You can change the port number using this configuration:

```js title="modern.config.ts"
export default defineConfig({
  server: {
    port: 3000,
  }
});
```
