---
sidebar_position: 4
---

# Plugins

This chapter describes the configuration of the registered module-tools plugin.

- type: `Array<ModuleToolsPlugin>`

```js modern.config.ts
import { examplePlugin } from '. /plugins/example';
export default defineConfig({
  plugins: [examplePlugin()],
});
```

For more information on how to write plugins, check out the [[Plugin Writing Guide]](/en/plugins/guide/getting-started).
