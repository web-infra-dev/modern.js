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
function ModifyBuilderConfig(
  callback: (
    config: BuilderConfig,
  ) => Promise<BuilderConfig | void> | BuilderConfig | void,
): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.modifyBuilderConfig(config => {
      config.html = config.html || {};
      config.html.title = 'Hello World!';
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

Called before creating the compiler instance, when you execute `builder.startDevServer`, `builder.build` or `builder.createCompiler`, this hook will be called. You can get the final config object of the bundler through the `bundlerConfigs` parameter.

- **Type**

```ts
function OnBeforeCreateCompiler(
  callback: (params: {
    bundlerConfigs: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
      console.log('the bundler config is ': bundlerConfigs);
    });
  },
});
```

### onAfterCreateCompiler

Called after creating a compiler instance, before executing a build, when you execute `builder.startDevServer`, `builder.build` or `builder.createCompiler`, this hook will be called. You can get the compiler instance through the `compiler` parameter.

- **Type**

```ts
function OnAfterCreateCompiler(callback: (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onAfterCreateCompiler(({ compiler }) => {
      console.log('the compiler is ': compiler);
    });
  },
});
```

## Build Hooks

### onBeforeBuild

Called before executing the production environment build, you can get the final config object of the bundler through the `bundlerConfigs` parameter.

- **Type**

```ts
function OnBeforeBuild(
  callback: (params: {
    bundlerConfigs?: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    api.onBeforeBuild(({ bundlerConfigs }) => {
      console.log('the bundler config is ': bundlerConfigs);
    });
  },
});
```

### onAfterBuild

Called after executing the production build, you can get the build result information through the `stats` parameter.

- **Type**

```ts
function OnAfterBuild(
  callback: (params: { stats?: Stats | MultiStats }) => Promise<void> | void,
): void;
```

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

Called before starting the development server.

- **Type**

```ts
function OnBeforeStartDevServer(callback: () => Promise<void> | void): void;
```

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

Called after starting the development server, you can get the port number through the `port` parameter.

- **Type**

```ts
function OnAfterStartDevServer(
  callback: (params: { port: number }) => Promise<void> | void,
): void;
```

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

Called after each development environment build, you can use `isFirstCompile` to determine whether it is the first build.

- **Type**

```ts
function OnDevCompileDone(
  callback: (params: { isFirstCompile: boolean }) => Promise<void> | void,
): void;
```

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

Called when the process is going to exit, this hook can only execute synchronous code.

- **Type**

```ts
function OnExit(callback: () => void): void;
```

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
