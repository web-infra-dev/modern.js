---
title: plugins
sidebar_position: 9
---

* Type: `CliPlugin[] | { cli: CliPlugin[] }`
* Default: `[]`

Used to configure custom Modern.js plugins.

For the way to write custom plugins, please refer to [How to Write Plugins](/docs/guides/topic-detail/framework-plugin/implement).

This option is used to configure the framework plugin. If you need to configure the webpack plugin, please use [tools.webpack](/docs/configure/app/tools/webpack) or [tools.webpack Chain](/docs/configure/app/tools/webpack-chain); If you need to configure the babel plugin, please use [tools.babel](/docs/configure/app/tools/babel).

## Plugin type

There are three different plug-in mechanisms built into the Modern.js:

- `CLI Plugin`，for local development, compilation and build phases, can extend various capabilities on the command line and compilation phases.
- `Server Plugin`，for server-level.
- `Runtime Plugin`，for runtime.

The ability to customize CLI plugins is currently open Modern.js, and the Server plugin and Runtime plugin will be available in the future.

## Plugin execution order

By default, custom plugins are executed sequentially in the order of an array of `plugins`, Modern.js built-in plugins are executed earlier than custom plugins.

When the plugin uses related fields that control the order, such as `pre` and `post`, the execution order will be adjusted based on the declared fields, see [Relationship between plugins](/docs/guides/topic-detail/framework-plugin/relationship).

## Example

Below is an example of using the CLI plugin.

### Using plugins on npm

To use the plugin on npm, you need to install the plugin through the package manager and import it.

```ts title="modern.config.ts"
import MyPlugin from 'my-plugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

### Use local plugins

Using the plugin in the local code repository, you can import it directly through the relative path import.

```ts title="modern.config.ts"
import MyPlugin from './config/plugin/MyPlugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

### Plugin configuration

If the plugin provides some custom configuration options, you can pass in the configuration through the parameters of the plugin function.

```ts title="modern.config.ts"
import MyPlugin from 'my-plugin';

export default defineConfig({
  plugins: [
    MyPlugin({
      foo: 1,
      bar: 2,
    }),
  ],
});
```
