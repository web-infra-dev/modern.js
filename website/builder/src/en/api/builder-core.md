---
extractApiHeaders: [2]
---

# Builder Core

This section describes some of the core methods provided by Builder.

## createBuilder

Create a Builder instance object.

When using this method, it needs to be used with the provider provided by `@modern-js/webpack-build-provider` or `@modern-js/rspack-builder`. The provider contains build logic related to a specific bundler.

### webpack provider

When `webpackBuildProvider` is passed, the Builder will use webpack as the bundler for building.

```ts
import { createBuilder } from '@modern-js/builder';
import { webpackBuildProvider } from '@modern-js/webpack-build-provider';

const provider = webpackBuildProvider({
  builderConfig: {
    // some configs
  },
});

const builder = await createBuilder(provider, {
  // some options
});
```

### rspack provider

When `rspackBuildProvider` is passed, the Builder will use rspack as the bundler for building.

```ts
import { createBuilder } from '@modern-js/builder';
import { rspackBuildProvider } from '@modern-js/rspack-builder';

const provider = rspackBuildProvider({
  builderConfig: {
    // some configs
  },
});

const builder = await createBuilder(provider, {
  // some options
});
```

> Tips: @modern-js/rspack-builder has not been developed yet.

### options

The second parameter of `createBuilder` is a options object, you can pass in the following options:

```ts
type BuilderEntry = Record<string, string | string[]>;

type BuilderTarget = 'web' | 'node' | 'modern-web';

type CreateBuilderOptions = {
  cwd?: string;
  entry?: BuilderEntry;
  target?: BuilderTarget | BuilderTarget[];
  framework?: string;
  configPath?: string | null;
};
```

Description:

- `cwd`: The root path of the current build, the default value is `process.cwd()`.
- `entry`: Build entry object.
- `target`: Build target type, the default value is `['web']`.
- `framework`: The name of the framework, a unique identifier, the default value is `'modern.js'`.
- `configPath`: The path to the framework config file (absolute path), this parameter affects the build cache update.

#### Target Type

`target` can be set to the following values:

- `web`: Build for browsers.
- `modern-web`: Build for modern browsers.
- `node`: Build for SSR scenarios.

When target is an array containing multiple values, Builder will perform multiple builds at the same time.

For example, we can build a browser target and an node target at the same time:

```ts
const builder = await createBuilder(provider, {
  target: ['web', 'node'],
});
```

## mergeBuilderConfig

Merges multiple Builder config objects and returns a new merged object.

- **Type**

```ts
function mergeBuilderConfig(...configs: BuilderConfig[]): BuilderConfig;
```

- **Example**

```ts
import { mergeBuilderConfig } from '@modern-js/builder';

const config1 = {
  dev: {
    https: false,
  },
};
const config2 = {
  dev: {
    https: true,
  },
};

const mergedConfig = mergeBuilderConfig(config1, config2);

console.log(mergedConfig); // { dev: { https: true } }
```

> This method does not modify the original config object.

## webpack

A webpack object for consuming webpack builtin plugins or type definitions.

- **Example**

```ts
import webpack from '@modern-js/webpack-build-provider/webpack';

new webpack.DefinePlugin();
```

> In most scenarios, it is recommended to import webpack from Builder instead of manually installing a "webpack" dependency, which can avoid multi-instance problems.

## HtmlWebpackPlugin

HtmlWebpackPlugin object, usually used to implement custom plugins of HtmlWebpackPlugin.

- **Example**

```ts
import HtmlWebpackPlugin from '@modern-js/webpack-build-provider/html-webpack-plugin';
```

> In most scenarios, it is recommended to import HtmlWebpackPlugin from builder instead of manually installing a "html-webpack-plugin" dependency, which can avoid multi-instance problems.
