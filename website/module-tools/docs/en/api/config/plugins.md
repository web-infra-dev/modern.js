---
sidebar_position: 4
---

# Plugins

This chapter describes the configuration of the registered module-tools plugin.

- type: `Array<ModuleToolsPlugin>`

```js modern.config.ts
import { ExamplePlugin } from '. /plugins/example';
export default defineConfig({
  plugins: [ExamplePlugin()],
});
```

For more information on how to write plugins, check out the [[Plugin Writing Guide]](/en/plugins/guide/getting-started).
