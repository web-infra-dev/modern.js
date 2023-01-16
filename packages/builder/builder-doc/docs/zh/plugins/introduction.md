# 插件系统

Builder 提供了一套轻量强大的插件系统，用以实现自身的大多数功能，并允许用户进行扩展。
开发者编写的插件能够修改 Builder 的默认行为并添加各类额外功能，包括但不限于：

- 修改 bundler 配置
- 处理新的文件类型
- 修改或编译文件
- 部署产物

Builder 底层支持 webpack 和 rspack 等 bundler，并提供统一的 Node.js API 来抹平插件开发的差异，进而接入不同的上层框架、降低用户对底层 bundler 切换的感知。

## 开发插件

插件提供类似 `(options?: PluginOptions) => BuilderPlugin` 的函数作为入口，建议将插件函数命名为 `builderPluginXXX`。

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';

export interface PluginFooOptions {
  message?: string;
}

export const builderPluginFoo = (options?: PluginFooOptions): BuilderPlugin => ({
  name: 'plugin-foo',
  setup(api) {
    api.onExit(() => {
      const msg = options.message || 'finish.';
      console.log(msg)
    });
  }
});

builder.addPlugins([
  builderPluginFoo({ message: 'some other message.' })
]);
```

函数形式的插件可以 **接受选项对象** 并 **返回插件实例**，并通过闭包机制管理内部状态。

其中各部分的作用分别为：

- `name` 属性用于标注插件名称
- `setup` 作为插件逻辑的主入口
- `api` 对象包含了各类钩子和工具函数

为了便于识别，插件名称需要包含约定的 `builder-plugin` 前缀，例如 `builder-plugin-foo` `@scope/builder-plugin-bar` 等。

## 生命周期钩子

Builder 在内部按照约定的生命周期进行任务调度，插件可以通过注册钩子来介入工作流程的任意阶段，并实现自己的功能。

Builder 生命周期钩子的完整列表参考 [API 文档](/api/plugin-hooks.html)。

Builder 不会接管底层 Bundler 的生命周期，相关生命周期钩子的使用方式见对应文档：[webpack hooks](https://webpack.js.org/api/compiler-hooks/)

## 使用配置项

自行编写的插件通常使用初始化时传入函数的参数作为配置项即可，开发者可以随意定义和使用函数的入参。

但某些情况下插件可能需要读取 / 修改 Builder 公用的配置项，这时就需要了解 Builder 内部对配置项的生产和消费流程：

- 读取、解析配置并合并默认值
- 插件通过 `api.modifyBuilderConfig(...)` 回调修改配置项
- 归一化配置项并提供给插件后续消费，此后无法再修改配置项

整套流程可以通过这个简单的插件体现：

```ts
export const PluginUploadDist = (): BuilderPlugin => ({
  name: 'plugin-upload-dist',
  setup(api) {
    api.modifyBuilderConfig(config => {
      // 尝试关闭代码压缩，需要自己填充默认值
      config.output ||= {};
      config.output.disableMinimize = true;
      // 轮到其它插件修改配置...
    });
    api.onBeforeBuild(() => {
      // 读取最终的配置
      const config = api.getNormalizedConfig();
      if (!config.output.disableMinimize) {
        // 其它插件又启用了压缩则报错
        throw new Error('You must disable minimize to upload readable dist files.');
      }
    });
    api.onAfterBuild(() => {
      const config = api.getNormalizedConfig();
      const distRoot = config.output.distPath.root;
      // TODO: 上传 `distRoot` 目录下所有产物文件
    });
  }
});
```

插件中有三种方式使用配置项对象：

- `api.modifyBuilderConfig(config => {})` 在回调中修改配置
- `api.getBuilderConfig()` 获取配置项
- `api.getNormalizedConfig()` 获取归一化后的配置项

归一化的配置项会再次合并默认值并移除大部分可选类型，对于 `PluginUploadDist` 的例子其部分类型定义为：

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

`getNormalizedConfig()` 的返回值类型与 `BuilderConfig` 的略有不同、相比文档其它地方描述的类型进行了收窄，
在使用时无需自行判空、填充默认值。

因此使用配置项的最佳方式应该是：

- 通过 `api.modifyBuilderConfig(config => {})` 来**修改配置**
- 在其后的生命周期中读取 `api.getNormalizedConfig()` 作为插件**实际使用的配置**

## 修改 webpack 配置

插件可以通过多种方式修改 webpack 的配置项。

- `api.modifyWebpackChain(chain => {})` 修改 webpack-chain
- `api.modifyWebpackConfig(config => {})` 修改最终的 webpack 配置
- `api.onAfterCreateCompiler(compiler => {})` 直接操作 webpack 实例

通常推荐使用 [neutrinojs/webpack-chain](https://github.com/neutrinojs/webpack-chain) 提供的链式 API 来修改 webpack 配置的工作。

Builder 使用的是兼容 webpack5 的修改版本：[sorrycc/webpack-chain](https://github.com/sorrycc/webpack-chain)。

## 参考范例

### 修改 Loader

Loader 可以读取和处理不同类型的文件模块，具体参考 [concepts](https://webpack.js.org/concepts/loaders) 和 [loaders](https://webpack.js.org/loaders/)。

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';

export const PluginTypeScriptExt = (): BuilderPlugin => ({
  name: 'builder-typescript-ext',
  setup(api) {
    api.modifyWebpackChain(async chain => {
      // 设置 ts-loader 将更多的文件识别为 typescript 模块
      chain.module
        .rule(CHAIN_ID.RULE.TS)
        .test(/\.(ts|mts|cts|tsx|tss|tsm)$/);
    });
  },
});
```

### 添加模块入口

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';

export const PluginAdminPanel = (): BuilderPlugin => ({
  name: 'builder-admin-panel',
  setup(api) {
    api.modifyWebpackChain(async chain => {
      config
        .entry('admin-panel')
        .add('src/admin/panel.js');
    });
  },
});
```

### 接入 webpack 插件

开发者可以在 Builder 插件中接入已有的 webpack 插件来平缓迁移项目：

```ts
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import type { Options } from '@modern-js/inspector-webpack-plugin';

export const PluginInspector = (options?: Options): BuilderPlugin => ({
  name: 'builder-plugin-inspector',
  setup(api) {
    api.modifyWebpackChain(async chain => {
      // 仅在需要的时候动态加载模块，避免不必要的性能消耗
      const { InspectorWebpackPlugin } = await import(
        '@modern-js/inspector-webpack-plugin'
      );
      // 修改 webpack chain 接入插件
      chain
        .plugin('inspector-webpack-plugin')
        .use(InspectorWebpackPlugin, [inspectorOptions]);
    });
  },
});
```
