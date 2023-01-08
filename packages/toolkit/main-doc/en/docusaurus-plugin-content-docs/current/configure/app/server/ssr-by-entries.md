---
sidebar_label: ssrByEntries
---

# server.ssrByEntries

- Type: `Object`
- Default: `undefined`

Set the ssr option according to the entry. The attributes in the option are the same as [ssr](./ssr.md). The specified value will be replaced and merged with the content of the ssr attribute. For example:

:::info
The "entry name" defaults to the directory name. In a few cases, when the entry is customized by `source.entries`, the entry name `source.entries` the `key` of the object.
:::

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    ssr: true,
    ssrByEntries: {
      // page-a does not enable ssr
      'page-a': false,
    },
  },
});
```

As configured above, the project has ssr enabled as a whole, but the ssr rendering capability is turned off for the entry `page-a`.
