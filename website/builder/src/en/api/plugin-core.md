---
extractApiHeaders: [2]
---

# Plugin Core

This section describes the core plugin types and APIs.

## BuilderPlugin

The type of the plugin object. The plugin object contains the following properties:

- `name`: The name of the plugin, a unique identifier.
- `setup`: The setup function of the plugin, which can be an asynchronous function. This function will only be executed once when the plugin is initialized.

```ts
export type BuilderPlugin<API = BuilderPluginAPI> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};
```

You can import this type from `@modern-js/builder`:

```ts
import type { BuilderPlugin } from '@modern-js/builder';

export default (): BuilderPlugin => ({
  name: 'builder-plugin-foo',

  setup: api => {
    api.onAfterBuild(() => {
      console.log('after build!');
    });
  },
});
```

## BuilderPluginAPI

The type of plugin API. The plugin API provides the context info, utility functions and lifecycle hooks.

For a complete introduction to lifecycle hooks, please read the [Plugin Hooks](./plugin-hooks) chapter.

When using webpack provider or rspack provider, the type definition of `BuilderPluginAPI` is somewhat different, and you can introduce the corresponding type according to the usage scenario of the plugin.

### Plugin for webpack provider

When developing plugins for webpack provider, please import `BuilderPluginAPI` from `@modern-js/builder-webpack-provider`.

```ts
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

export default (): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-foo',

  setup: api => {
    api.modifyWebpackConfig(config => {
      config.devtool = false;
    });
  },
});
```

### Plugins for rspack provider

When developing plugins for rspack provider, please import `BuilderPluginAPI` from `@modern-js/builder-rspack-provider`.

```ts
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-rspack-provider';

export default (): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-foo',

  setup: api => {
    api.modifyRspackConfig(config => {
      config.devtool = false;
    });
  },
});
```

### api.context

`api.context` is a read-only object that provides some context information.

The content of `api.context` is exactly the same as `builder.context`, please refer to [builder.context](/api/builder-instance.html#builder-context).

- **Example**

```ts
const PluginFoo = () => ({
   setup(api) {
     console.log(api.context.distPath);
   }
);
```

### api.getBuilderConfig

Get the Builder config, this method must be called after the `modifyBuilderConfig` hook is executed.

- **Type**

```ts
function GetBuilderConfig(): Readonly<BuilderConfig>;
```

- **Example**

```ts
const PluginFoo = () => ({
   setup(api) {
     const config = api. getBuilderConfig();
     console.log(config.html?.title);
   }
);
```

### api.getNormalizedConfig

## api.getNormalizedConfig

Get the normalized Builder config, this method must be called after the `modifyBuilderConfig` hook is executed.

Compared with the `api.getBuilderConfig` method, the config returned by this method has been normalized, and the type definition of the config will be narrowed. For example, the `undefined` type of `config.html` will be removed.

It is recommended to use this method to get the Builder config.

- **Type**

```ts
function GetNormalizedConfig(): Readonly<NormalizedConfig>;
```

- **Example**

```ts
const PluginFoo = () => ({
   setup(api) {
     const config = api. getNormalizedConfig();
     console.log(config.html.title);
   }
);
```

### api.isPluginExists

Determine whether a plugin has been registered.

- **Type**

```ts
function IsPluginExists(pluginName: string): boolean;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    console.log(api.isPluginExists('builder-plugin-foo'));
  },
});
```

### api.getHTMLPaths

Get path information for all HTML assets.

This method will return an object, the key is the entry name and the value is the relative path of the HTML file in the dist directory.

- **Type**

```ts
function GetHTMLPaths(): Record<string, string>;
```

- **Example**

```ts
const PluginFoo = () => ({
   setup(api) {
     api.modifyWebpackChain(() => {
       const htmlPaths = api. getHTMLPaths();
       console.log(htmlPaths); // { main: 'html/main/index.html' };
     });
   }
);
```
