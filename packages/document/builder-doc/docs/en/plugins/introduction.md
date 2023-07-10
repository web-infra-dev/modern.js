# Introduce to Plugin

Builder provides developers with a lightweight but powerful plugin system to build itself and any other plugins.
Developing plugins to change the Builder's behavior and introduce extra features. such as:

- Modify config of bundlers.
- Resolve and handle new file types.
- Modify and compile file modules.
- Deploy your application.

Builder can use webpack or Rspack as the bundler, expose unified Node.js API, and integrate into different frameworks. Users can painlessly switch between bundlers.

## Write a plugin

Plugin module should export an entry function just like `(options?: PluginOptions) => BuilderPlugin`, It is recommended to name plugin functions `builderPluginXXX`.

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';

export interface PluginFooOptions {
  message?: string;
}

export const builderPluginFoo = (
  options?: PluginFooOptions,
): BuilderPlugin => ({
  name: 'plugin-foo',
  setup(api) {
    api.onExit(() => {
      const msg = options.message || 'finish.';
      console.log(msg);
    });
  },
});

builder.addPlugins([builderPluginFoo('some other message.')]);
```

The function usually **takes an options object** and **returns the plugin instance**, which manages state through closures.

Let's look at each part:

- `name` is used to label the plugin
- `setup` as the main entry point of plugins
- `api` provides context object, lifetime hooks and utils.

The package name of the plugin needs to contain the conventional `builder-plugin` prefix for identification, just like `builder-plugin-foo`, `@scope/builder-plugin-bar`, etc.

## Lifetime Hooks

Builder uses lifetime planning work internally, and plugins can also register hooks to take part in any stage of the workflow and implement their own features.

The full list of Builder's lifetime hooks can be found in the [API References](/api/plugin-hooks.html).

The Builder does not take over the hooks of the underlying bundlers, whose documents can be found here: [webpack hooks](https://webpack.js.org/api/compiler-hooks/)

## Use Builder Config

Custom plugins can usually get config from function parameters,
just define and use it at your pleasure.

But sometimes you may need to read and change the public config of the Builder. To begin with, you should understand how the Builder generates and uses its config:

- Read, parse config and merge with default values.
- Plugins modify the config by `api.modifyBuilderConfig(...)`.
- Normalize the config and provide it to consume, then the config can no longer be modified.

Refer to this tiny example:

```ts
export const builderPluginUploadDist = (): BuilderPlugin => ({
  name: 'plugin-upload-dist',
  setup(api) {
    api.modifyBuilderConfig(config => {
      // try to disable minimize.
      // should deal with optional value by self.
      config.output ||= {};
      config.output.disableMinimize = true;
      // but also can be enable by other plugins...
    });
    api.onBeforeBuild(() => {
      // use the normalized config.
      const config = api.getNormalizedConfig();
      if (!config.output.disableMinimize) {
        // let it crash when enable minimize.
        throw new Error(
          'You must disable minimize to upload readable dist files.',
        );
      }
    });
    api.onAfterBuild(() => {
      const config = api.getNormalizedConfig();
      const distRoot = config.output.distPath.root;
      // TODO: upload all files in `distRoot`.
    });
  },
});
```

There are 3 ways to use Builder config:

- register callback with `api.modifyBuilderConfig(config => {})` to modify config.
- use `api.getBuilderConfig()` to get Builder config.
- use `api.getNormalizedConfig()` to get finally normalized config.

When normalized, it will again merge the config object with the default values
and make sure the optional properties exist.
So for PluginUploadDist, part of its type looks like:

```ts
api.modifyBuilderConfig((config: BuilderConfig) => {});
api.getBuilderConfig() as BuilderConfig;
type BuilderConfig = {
  output?: {
    disableMinimize?: boolean;
    distPath?: { root?: string };
  };
};

api.getNormalizedConfig() as NormalizedConfig;
type NormalizedConfig = {
  output: {
    disableMinimize: boolean;
    distPath: { root: string };
  };
};
```

The return value type of `getNormalizedConfig()` is slightly different from that of `BuilderConfig` and is narrowed compared to the types described elsewhere in the documentation.
You don't need to fill in the defaults when you use it.

Therefore, the best way to use configuration options is to

- **Modify the config** with `api.modifyBuilderConfig(config => {})`
- Read `api.getNormalizedConfig()` as the **actual config used by the plugin** in the further lifetime.

## Modify webpack Config

Plugins can handle webpack's config by:

- use `api.modifyWebpackChain(chain => {})` to modify webpack-chain.
- use `api.modifyWebpackConfig(config => {})` to modify raw webpack config.
- use `api.onAfterCreateCompiler(compiler => {})` to handle webpack instance directly.

We recommend that you use [neutrinojs/webpack-chain](https://github.com/neutrinojs/webpack-chain)'s
chained api to handle the config of webpack whenever possible.

Builder integrated a webpack5-compatible version,
which can be found in [sorrycc/webpack-chain](https://github.com/sorrycc/webpack-chain).

## Examples

### Modify Loaders

The webpack loaders can be used to load and transform various file types. For more information, see [concepts](https://webpack.js.org/concepts/loaders) and [loaders](https://webpack.js.org/loaders/).

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';

export const builderPluginTypeScriptExt = (): BuilderPlugin => ({
  name: 'builder-typescript-ext',
  setup(api) {
    api.modifyWebpackChain(async chain => {
      // set ts-loader to recognize more files as typescript modules.
      chain.module.rule(CHAIN_ID.RULE.TS).test(/\.(ts|mts|cts|tsx|tss|tsm)$/);
    });
  },
});
```

### Add Entry Points

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';

export const builderPluginAdminPanel = (): BuilderPlugin => ({
  name: 'builder-admin-panel',
  setup(api) {
    api.modifyWebpackChain(async chain => {
      config.entry('admin-panel').add('src/admin/panel.js');
    });
  },
});
```

### Integrate webpack Plugins

Integrate existing webpack plugins to migrate your applications:

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import type { Options } from '@modern-js/inspector-webpack-plugin';

export const builderPluginInspector = (options?: Options): BuilderPlugin => ({
  name: 'builder-plugin-inspector',
  setup(api) {
    api.modifyWebpackChain(async chain => {
      // load modules dynamically only when needed
      // to avoid unnecessary performance cost.
      const { InspectorWebpackPlugin } = await import(
        '@modern-js/inspector-webpack-plugin'
      );
      // modify webpack-chain to setup webpack plugin.
      chain
        .plugin('inspector-webpack-plugin')
        .use(InspectorWebpackPlugin, [inspectorOptions]);
    });
  },
});
```
