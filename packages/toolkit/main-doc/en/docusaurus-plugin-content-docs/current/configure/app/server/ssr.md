---
sidebar_label: ssr
---

# server.ssr

- Type: `boolean`
- Default: `false`

Enalbe SSR configuration.

When the value type is `boolean`, it indicates whether to enable SSR deployment mode, and `false` is not enabled by default.

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    ssr: true,
  },
});
```
