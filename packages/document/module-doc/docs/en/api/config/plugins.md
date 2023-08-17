---
sidebar_position: 4
---

# plugins

This chapter describes the configuration of the registered Module Tools plugin.

- **Type**: `ModuleToolsPlugin[]`
- **Default**: `undefined`

## Plugin Execution Order

By default, custom plugins are executed in the order specified in the `plugins` array. The execution of built-in plugins provided by Module Tools happens before the execution of custom plugins.

When plugins use fields that control the execution order, such as `pre` and `post`, the execution order is adjusted based on the declared fields. For more information, please refer to the [Relationship Between Plugins](https://modernjs.dev/en/guides/topic-detail/framework-plugin/relationship) guide.

## Developing Plugins

To learn how to write plugins, please refer to the [Plugin Writing Guide](/plugins/guide/getting-started).

## Example

### Using Plugins from npm

To use plugins from npm, you need to install them using a package manager and import them in your configuration file.

```js title="modern.config.ts"
import { myPlugin } from 'my-plugin';

export default defineConfig({
  plugins: [myPlugin()],
});
```

#### Using Local Plugins

To use plugins from a local code repository, you can directly import them using a relative path.

```js title="modern.config.ts"
import { myPlugin } from './plugins/myPlugin';

export default defineConfig({
  plugins: [myPlugin()],
});
```

### Plugin Configuration

If a plugin provides custom configuration options, you can pass the configuration through the plugin function's parameters.

```js title="modern.config.ts"
import { myPlugin } from 'my-plugin';

export default defineConfig({
  plugins: [
    myPlugin({
      foo: 1,
      bar: 2,
    }),
  ],
});
```
