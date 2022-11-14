---
extractApiHeaders: [2]
---

# Plugin Core

This section describes the plugin API.

## BuilderPlugin

Builder plugin instance.

```typescript
export type BuilderPlugin<API = BuilderPluginAPI> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};
```

- `name` is used to label the plugin
- `setup` as the main entry point of plugins
- `api` provides context object, lifetime hooks and utils.

## BuilderPluginAPI

The API object provides context, utils, and hook register function for plugins.

More about lifetime hooks, refer to [Plugin Hooks](./plugin-hooks).

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
