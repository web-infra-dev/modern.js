---
extractApiHeaders: [2]
---

# Plugin Hooks

本章节描述了 Builder 插件提供的生命周期钩子。

## 概览

**通用钩子**

- `modifyBuilderConfig`：修改传递给 Builder 的配置项。
- `modifyWebpackChain`：修改 webpack chain 配置。
- `modifyWebpackConfig`：修改最终的 webpack 配置对象。
- `modifyRspackConfig`：修改最终的 rspack 配置对象。
- `onBeforeCreateCompiler`：在创建 compiler 实例前调用。
- `onAfterCreateCompiler`：在创建 compiler 实例后、执行构建前调用。

**构建钩子**：仅在执行 build 方法构建生产环境产物时调用。

- `onBeforeBuild`：在执行生产环境构建前调用。
- `onAfterBuild`：在执行生产环境构建后调用，可以获取到构建结果信息。

**开发服务钩子**：仅在执行 startDevServer 方法运行开发服务器时调用。

- `onBeforeStartDevServer`：在启动开发服务器前调用。
- `onAfterStartDevServer`：在启动开发服务器后调用。
- `onDevCompileDone`：在每次开发环境构建结束后调用。

**其他钩子**

- `onExit`：在进程即将退出时调用。

## 通用钩子

### modifyBuilderConfig

修改传递给 Builder 的配置项，你可以直接修改传入的 config 对象，也可以返回一个新的对象来替换传入的对象。

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

通过 webpack chain 来修改 webpack 配置。该方法仅在使用 webpack provider 时调用。

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

修改最终的 webpack 配置对象，你可以直接修改传入的 config 对象，也可以返回一个新的对象来替换传入的对象。该方法仅在使用 webpack provider 时调用。

该方法的调用时机晚于 `modifyWebpackChain` 钩子。

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

修改最终的 rspack 配置对象，你可以直接修改传入的 config 对象，也可以返回一个新的对象来替换传入的对象。该方法仅在使用 rspack provider 时调用。

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

!!!include(./src/zh/shared/onBeforeCreateCompiler.md)!!!

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

!!!include(./src/zh/shared/onAfterCreateCompiler.md)!!!

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

## 构建钩子

### onBeforeBuild

!!!include(./src/zh/shared/onBeforeBuild.md)!!!

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

!!!include(./src/zh/shared/onAfterBuild.md)!!!

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

## 开发服务钩子

### onBeforeStartDevServer

!!!include(./src/zh/shared/onBeforeStartDevServer.md)!!!

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

!!!include(./src/zh/shared/onAfterStartDevServer.md)!!!

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

!!!include(./src/zh/shared/onDevCompileDone.md)!!!

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

## 其他钩子

### onExit

!!!include(./src/zh/shared/onExit.md)!!!

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
