---
sidebar_label: prefix
---

# bff.prefix

- Type: `string`
- Default: `/api`

:::caution Caution
First you need to enable the "BFF" function using [new](/docs/apis/app/commands/new) command.
:::

By default, the route access BFF prefix's directory is `/api`, with the following directory structure:

```bash
api
└── hello.ts
```

The corresponding route for `api/hello.ts` access is `localhost:8080/api/hello`.

This configuration option can modify the default route prefix:

```ts title="modern.config.ts"
export default defineConfig({
  bff: {
    prefix: '/api-demo',
  },
});
```

The corresponding `api/hello.ts` access route is `localhost:8080/api-demo/hello`.
