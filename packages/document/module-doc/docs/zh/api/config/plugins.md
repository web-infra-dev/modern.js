---
sidebar_position: 4
---

# Plugins

本章介绍注册 Module Tools 插件的配置。

- 类型：`Array<ModuleToolsPlugin>`

```js modern.config.ts
import { examplePlugin } from './plugins/example';
export default defineConfig({
  plugins: [examplePlugin()],
});
```

关于如何编写插件，可以查看[【插件编写指南】](/plugins/guide/getting-started)。
