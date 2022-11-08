# Introduce to Plugin

Builder provides developers with a lightweight but powerful plugin system to build itself and any other plugins.
Developing plugins to change the builder's behavior and introduce extra features. such as:

- Resolve and handle new file types.
- Modify and compile file modules.
- Deploy your application.

Builder can use webpack or rspack as bundler, expose unified Node.js API,
and integrate into different frameworks. More importantly, making switching between bundlers painless.

**But users can't use builder plugins directly in frameworks.**
Because these frameworks (e.g. modern.js) not only reuse the compiling features
provided by the builder, but can also be built with lots of other parts.

## 开发插件

插件提供类似 `(options?: PluginOptions) => BuilderPlugin` 的函数作为入口。

```typescript
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';

export interface PluginFooOptions {
  message?: string;
}

export const PluginFoo = (options?: PluginFooOptions): BuilderPlugin => ({
  name: 'plugin-foo',
  setup(api) {
    api.onExit(() => {
      const msg = options.message || 'finish.';
      console.log(msg)
    });
  }
});

builder.addPlugins([PluginFoo('some other message.')]);
```

函数形式的插件可以 **接受选项对象** 并 **返回插件实例**，并通过闭包机制管理内部状态。

其中各部分的作用分别为：

- `name` 属性用于标注插件名称
- `setup` 作为插件逻辑的主入口
- `api` 对象包含了各类钩子和工具函数

为了便于识别，插件名称需要包含约定的 `modernjs-plugin` 前缀，例如 `modernjs-plugin-foo` `@scope/modernjs-plugin-bar` 等。

## 生命周期钩子

Builder 在内部按照约定的生命周期进行任务调度，插件可以通过注册钩子来介入工作流程的任意阶段并实现自己的功能。

- **通用钩子**
  - `modifyBuilderConfig`：修改传递给 Builder 的配置项
  - `modifyWebpackChain`：修改 Webpack Chain 配置
  - `modifyWebpackConfig`：修改最终的 Webpack 配置
  - `onBeforeCreateCompiler`：创建编译器前触发
  - `onAfterCreateCompiler`：创建编译器后触发、在构建前操作编译器实例
- **构建钩子**：仅运行构建输出产物时触发
  - `onBeforeBuild`：构建前触发
  - `onAfterBuild`：构建后触发、获取构建结果信息
- **开发服务钩子**：仅运行开发服务器时触发
  - `onBeforeStartDevServer`：启动开发服务器前触发
  - `onAfterStartDevServer`：启动开发服务器后触发
  - `onDevCompileDone`：每次增量构建结束后触发
- **进程钩子**
  - `onExit`：运行构建的进程即将退出时触发

Builder 不会接管底层 Bundler 的生命周期，相关生命周期钩子的使用方式见对应文档：[webpack hooks](https://webpack.js.org/api/compiler-hooks/)

## 使用配置项

自行编写的插件通常使用初始化时传入函数的参数作为配置项即可，开发者可以随意定义和使用函数的入参。

但某些情况下插件可能需要读取 / 修改 Builder 公用的配置项，例如将 Babel 替换为 ESBuild / SWC 来提升构建速度等等。
这时就需要了解 Builder 内部对配置项的生产和消费流程：

- 读取、解析配置并合并默认值
- 插件通过 `api.modifyBuilderConfig(...)` 回调修改配置项
- 归一化配置项并提供给插件后续消费，此后无法再修改配置项

整套流程可以通过这个简单的插件体现：

```typescript
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

```typescript
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

```typescript
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
      // 修改 Webpack Chain 接入插件
      chain
        .plugin('inspector-webpack-plugin')
        .use(InspectorWebpackPlugin, [inspectorOptions]);
    });
  },
});
```

### 添加模块入口

```typescript
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
      // 修改 Webpack Chain 接入插件
      chain
        .plugin('inspector-webpack-plugin')
        .use(InspectorWebpackPlugin, [inspectorOptions]);
    });
  },
});
```

### 接入 webpack 插件

开发者可以在 Builder 插件中接入已有的 webpack 插件来平缓迁移项目：

```typescript
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
      // 修改 Webpack Chain 接入插件
      chain
        .plugin('inspector-webpack-plugin')
        .use(InspectorWebpackPlugin, [inspectorOptions]);
    });
  },
});
```
