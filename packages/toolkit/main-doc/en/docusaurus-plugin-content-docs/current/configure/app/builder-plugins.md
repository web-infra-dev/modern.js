---
title: builderPlugins
sidebar_position: 10
---

- Type: `BuilderPlugin[]`
- Default: `[]`

Used to configure the Modern.js Builder plugin.

Modern.js Builder is the build engine of Modern.js, please read [Builder](/docs/guides/basic-features/builder) for background. If you want to know how to write Builder plugins, you can refer to [Modern.js Builder - Introduce to Plugin](https://modernjs.dev/builder/en/plugins/introduction.html).

## Precautions

This option **is used to configure the Modern.js Builder plugins**. If you need to configure other types of plugins, please select the corresponding configs:

- Use [plugins](docs/configure/app/builder-plugins) to configure Modern.js framework plugins.
- Use [tools.webpack](/docs/configure/app/tools/webpack) or [tools.webpackChain](/docs/configure/app/tools/webpack-chain) to configure webpack plugins.
- Use [tools.babel](/docs/configure/app/tools/babel) to configure babel plugins.

## When to use

In most scenarios, we recommend you to use the Modern.js framework plugin, which can be registered through the [plugins](docs/configure/app/plugins) config. Because the API provided by the framework plugin is richer and more capable, while the API provided by the Builder plugin can only be used to build scenes.

When you need to reference some existing Builder plugins (and there is no related capability in Modern.js), or reuse Builder plugins between different frameworks, you can use the `builderPlugins` field to register them.

## Example

Below is an example of using the Builder plugin.

### Using plugins on npm

To use a plugin on npm, you need to install the plugin through the package manager and import it.

```ts title="modern.config.ts"
import myBuilderPlugin from 'my-builder-plugin';

export default defineConfig({
  builderPlugins: [myBuilderPlugin()],
});
```

### Using local plugins

Use the plugin in the local code repository, you can import it directly through the relative path import.

```ts title="modern.config.ts"
import myBuilderPlugin from './plugin/myBuilderPlugin';

export default defineConfig({
  builderPlugins: [myBuilderPlugin()],
});
```

### Plugin configuration items

If the plugin provides some custom configuration options, you can pass in the configuration through the parameters of the plugin function.

```ts title="modern.config.ts"
import myBuilderPlugin from 'my-builder-plugin';

export default defineConfig({
  builderPlugins: [
    myBuilderPlugin({
      foo: 1,
      bar: 2,
    }),
  ],
});
```
