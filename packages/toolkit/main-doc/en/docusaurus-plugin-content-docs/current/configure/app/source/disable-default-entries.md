---
title: source.disableDefaultEntries
sidebar_label: disableDefaultEntries
---

- Type: `boolean`
- Default: `false`

Turn off the function of automatically identifying the application build entry according to the project directory structure. By default, the Modern.js will get the corresponding build entry according to the project directory structure.

:::info
By default, Modern.js will get the corresponding entry information according to the project directory structure. For details, please refer to [Entry](/docs/guides/concept/entries).
After configuring the shutdown mechanism, you need to configure the custom entry with [`source.entries`](/docs/configure/app/source/entries).
:::

:::warning Warning
Organizing your code according to the catalog specification provided by the Modern.js is recommended to make better use of the framework's capabilities and avoid some redundant configuration.
:::

Set the following to turn off the default behavior:

```js title="modern.config.js"
export default defineConfig({
  source: {
    disableDefaultEntries: true,
  },
});
```
