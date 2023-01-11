---
extractApiHeaders: [2]
---

# Plugin Hooks

This section describes the lifetime hooks provided by Builder plugin.

## Overview

**Common Hooks**

- `modifyBuilderConfig`: Modify raw config of Builder.
- `modifyWebpackChain`: Modify webpack-chain.
- `modifyWebpackConfig`: Modify raw config of webpack.
- `modifyRspackConfig`: Modify raw config of rspack.
- `onBeforeCreateCompiler`: Called before creating compiler instance.
- `onAfterCreateCompiler`: Called after the compiler object is created, but before the build is executed.

**Build Hooks**：Called only when the build method is executed to build the production outputs.

- `onBeforeBuild`: Called before the production build is executed.
- `onAfterBuild`: Called after executing the production build, you can get the build stats.

**Dev Server Hooks**: Called only when the startDevServer method is executed to run the development server.

- `onBeforeStartDevServer`: Called before starting the development server.
- `onAfterStartDevServer`: Called after starting the development server.
- `onDevCompileDone`: Called after each development compile.

**Other Hooks**

- `onExit`: Called when the process is going to exit.

## Common Hooks

### modifyBuilderConfig

Modify the config passed to the Builder, you can directly modify the config object, or return a new object to replace the previous object.

- **Type**

```ts
type ModifyWebpackChainUtils = {
  mergeBuilderConfig: typeof mergeBuilderConfig;
};

function ModifyBuilderConfig(
  callback: (
    config: BuilderConfig,
    utils: ModifyWebpackChainUtils,
  ) => PromiseOrNot<BuilderConfig | void>,
): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.modifyBuilderConfig((config, { mergeBuilderConfig }) => {
      config.html = config.html || {};
      config.html.title = 'Hello World!';
      return mergeBuilderConfig(config, {
        source: { preEntry: 'foo.js' }
      });
    });
  },
});
```

### modifyWebpackChain

Modify the webpack config through the webpack chain. This method is only called when using webpack provider.

- **Type**

```ts
type ModifyWebpackChainUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  webpack: typeof import('webpack');
  isServer: boolean;
  isWebWorker: boolean;
  CHAIN_ID: ChainIdentifier;
  getCompiledPath: (name: string) => string;
  HtmlWebpackPlugin: typeof import('html-webpack-plugin');
};

function ModifyWebpackChain(
  callback: (
    chain: WebpackChain,
    utils: ModifyWebpackChainUtils,
  ) => Promise<void> | void,
): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.modifyWebpackChain((chain, utils) => {
      if (utils.env === 'development') {
        chain.devtool('eval');
      }
    });
  },
});
```

### modifyWebpackConfig

To modify the final webpack config object, you can directly modify the config object, or return a new object to replace the previous object. This method is only called when using webpack provider.

This method is called later than the `modifyWebpackChain` hook.

- **Type**

```ts
type ModifyWebpackConfigUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  webpack: typeof import('webpack');
  isServer: boolean;
  isWebWorker: boolean;
  CHAIN_ID: ChainIdentifier;
  getCompiledPath: (name: string) => string;
  HtmlWebpackPlugin: typeof import('html-webpack-plugin');
  addRules: (rules: RuleSetRule | RuleSetRule[]) => void;
  prependPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
};

function ModifyWebpackConfig(
  callback: (
    config: WebpackConfig,
    utils: ModifyWebpackConfigUtils,
  ) => Promise<WebpackConfig | void> | WebpackConfig | void,
): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.modifyWebpackConfig((config, utils) => {
      if (utils.env === 'development') {
        config.devtool = 'eval';
      }
    });
  },
});
```

### modifyRspackConfig

To modify the final rspack config object, you can directly modify the config object, or return a new object to replace the previous object. This method is only called when using rspack provider.

- **Type**

```ts
type ModifyRspackConfigUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  isServer: boolean;
  isWebWorker: boolean;
  getCompiledPath: (name: string) => string;
};

function ModifyRspackConfig(
  callback: (
    config: RspackConfig,
    utils: ModifyRspackConfigUtils,
  ) => Promise<RspackConfig | void> | RspackConfig | void,
): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.modifyRspackConfig((config, utils) => {
      if (utils.env === 'development') {
        config.devtool = 'eval';
      }
    });
  },
});
```

### onBeforeCreateCompiler

!!!include(./src/en/shared/onBeforeCreateCompiler.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
      console.log('the bundler config is ', bundlerConfigs);
    });
  },
});
```

### onAfterCreateCompiler

!!!include(./src/en/shared/onAfterCreateCompiler.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onAfterCreateCompiler(({ compiler }) => {
      console.log('the compiler is ', compiler);
    });
  },
});
```

## Build Hooks

### onBeforeBuild

!!!include(./src/en/shared/onBeforeBuild.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onBeforeBuild(({ bundlerConfigs }) => {
      console.log('the bundler config is ', bundlerConfigs);
    });
  },
});
```

### onAfterBuild

!!!include(./src/en/shared/onAfterBuild.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onAfterBuild(({ stats }) => {
      console.log(stats?.toJson());
    });
  },
});
```

## Dev Server Hooks

### onBeforeStartDevServer

!!!include(./src/en/shared/onBeforeStartDevServer.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onBeforeStartDevServer(() => {
      console.log('before start!');
    });
  },
});
```

### onAfterStartDevServer

!!!include(./src/en/shared/onAfterStartDevServer.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onAfterStartDevServer(({ port }) => {
      console.log('this port is: ', port);
    });
  },
});
```

### onDevCompileDone

!!!include(./src/en/shared/onDevCompileDone.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onDevCompileDone(({ isFirstCompile }) => {
      if (isFirstCompile) {
        console.log('first compile!');
      } else {
        console.log('re-compile!');
      }
    });
  },
});
```

## Other Hooks

### onExit

!!!include(./src/en/shared/onExit.md)!!!

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onExit(() => {
      console.log('exit!');
    });
  },
});
```
