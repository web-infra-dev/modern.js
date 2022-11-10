---
extractApiHeaders: [2]
---

# Plugin Core

本章节描述了插件实例和插件 API。

## BuilderPlugin

插件实例对象。

```typescript
export type BuilderPlugin<API = BuilderPluginAPI> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};
```

- `name`：标注插件的名称用以识别
- `setup`：插件逻辑的主入口

## BuilderPluginAPI

API 对象上挂载了提供给插件使用的上下文数据、工具函数和用于注册钩子回调的函数。

生命周期钩子的具体定义见 [插件钩子](./plugin-hooks) 章节。

### api.context

TODO

### api.getHTMLPaths

TODO

### api.getBuilderConfig

TODO

### api.getNormalizedConfig

TODO

### api.isPluginExists

TODO
