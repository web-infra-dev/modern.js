# 概览

Builder 提供了一套简洁强大的插件系统，用以实现自身的大多数功能并允许用户对其能力进行拓展。

底层支持接入 webpack 和 rspack 等不同 bundler 来满足不同的项目需求，并向上提供统一 API 来抹平插件开发的差异，
以期用户降低用户对底层 bundler 切换的感知。

开发者则可以通过开发插件来调度底层构建引擎，或是添加构建引擎无关的通用能力。

## 生命周期钩子

- `modifyBuilderConfig`
- `modifyWebpackChain`
- `modifyWebpackConfig`
- `onBeforeCreateCompiler`
- `onAfterCreateCompiler`
- `onBeforeStartDevServer`
- `onAfterStartDevServer`
- `onBeforeBuild`
- `onAfterBuild`
- `onDevCompileDone`
- `onExit`

## 开发插件

约定插件名称需要包含 `modernjs-plugin` 前缀，例如 `modernjs-plugin-foo` 或者 `@scope/modernjs-plugin-bar` 等。

开发者需要提供类似 `(options?: PluginOptions) => BuilderPlugin` 的函数作为插件入口，这个函数通常接受选项对象并输出插件实例。

符合规范的最简示例可以参考：

```typescript
import { BuilderPlugin } from '@modern-js/builder-webpack-provider';

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

### 使用配置项

插件中可以通过三种方式使用配置项对象：

- `api.getConfig()` 获取合并默认值后的配置
- `api.getNormalizedConfig()` 获取归一化后类型收窄的配置
- `api.modifyBuilderConfig(config => {})` 在回调中修改配置

Builder 对配置项的生产和消费流程有着严格的规定，其次序大致如下：

- 读取、解析配置并合并默认值
- 插件通过 `api.modifyBuilderConfig(...)` 回调修改配置项
- 归一化配置项并提供给插件后续消费

整套流程可以参考以下简单的插件实现：

```typescript
export const PluginUploadDist = (): BuilderPlugin => ({
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
      const config = api.getNormalizedConfig();
      if (!config.output.disableMinimize) {
        // let it crash when enable minimize.
        throw new Error('You must disable minimize to upload readable dist files.');
      }
    });
    api.onAfterBuild(() => {
      const config = api.getNormalizedConfig();
      const distRoot = config.output.distPath.root;
      // TODO: upload all files in `distRoot`.
    });
  }
});
```
