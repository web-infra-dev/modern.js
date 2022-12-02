---
extractApiHeaders: [2]
---

# Plugin Core

本章节描述了 Builder 插件核心的类型定义和 API。

## BuilderPlugin

插件对象的类型，插件对象包含以下属性：

- `name`：插件的名称，唯一标识符。
- `setup`：插件逻辑的主入口函数，可以是一个异步函数。该函数仅会在初始化插件时执行一次。

```ts
type BuilderPlugin<API = BuilderPluginAPI> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};
```

你可以从 `@modern-js/builder` 中导入该类型：

```ts
import type { BuilderPlugin } from '@modern-js/builder';

export default (): BuilderPlugin => ({
  name: 'builder-plugin-foo',

  setup: api => {
    api.onAfterBuild(() => {
      console.log('after build!');
    });
  },
});
```

## BuilderPluginAPI

插件 API 对象的类型。插件 API 对象上挂载了提供给插件使用的上下文数据、工具函数和注册生命周期钩子的函数。

关于生命周期钩子的完整介绍，请阅读 [Plugin Hooks](./plugin-hooks) 章节。

在使用 webpack provider 或 rspack provider 时，`BuilderPluginAPI` 的类型定义有一定不同，你可以根据插件的使用场景来引入对应的类型。

### 适用于 webpack provider 的插件

开发适用于 webpack provider 的插件时，请从 `@modern-js/builder-webpack-provider` 中引入 `BuilderPluginAPI`。

```ts
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

export default (): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-foo',

  setup: api => {
    api.modifyWebpackConfig(config => {
      config.devtool = false;
    });
  },
});
```

### 适用于 rspack provider 的插件

开发适用于 rspack provider 的插件时，请从 `@modern-js/builder-rspack-provider` 中引入 `BuilderPluginAPI`。

```ts
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-rspack-provider';

export default (): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-foo',

  setup: api => {
    api.modifyRspackConfig(config => {
      config.devtool = false;
    });
  },
});
```

## api.context

`api.context` 是一个只读对象，提供一些上下文信息。

`api.context` 的内容与 `builder.context` 完全一致，请参考 [builder.context](/api/builder-instance.html#builder-context)。

- **Example**

```ts
const PluginFoo = () => ({
  setup(api) {
    console.log(api.context.distPath);
  }
);
```

## api.getBuilderConfig

获取 Builder 配置，该方法必须在 `modifyBuilderConfig` 钩子执行完成后才能被调用。

- **Type**

```ts
function GetBuilderConfig(): Readonly<BuilderConfig>;
```

- **Example**

```ts
const PluginFoo = () => ({
  setup(api) {
    const config = api.getBuilderConfig();
    console.log(config.html?.title);
  }
);
```

## api.getNormalizedConfig

获取归一化后的 Builder 配置，该方法必须在 `modifyBuilderConfig` 钩子执行完成后才能被调用。

相较于 `api.getBuilderConfig` 方法，该方法返回的配置经过了归一化处理，配置的类型定义会得到收敛，比如 `config.html` 的 `undefined` 类型将被移除。

推荐优先使用该方法获取配置。

- **Type**

```ts
function GetNormalizedConfig(): Readonly<NormalizedConfig>;
```

- **Example**

```ts
const PluginFoo = () => ({
  setup(api) {
    const config = api.getNormalizedConfig();
    console.log(config.html.title);
  }
);
```

## api.isPluginExists

判断某个插件是否已经被注册。

- **Type**

```ts
function IsPluginExists(pluginName: string): boolean;
```

- **Example**

```ts
export default () => ({
  setup: api => {
    console.log(api.isPluginExists('builder-plugin-foo'));
  },
});
```

## api.getHTMLPaths

获取所有 HTML 产物的路径信息。

该方法会返回一个对象，对象的 key 为 entry 名称，value 为 HTML 文件在产物目录下的相对路径。

- **Type**

```ts
function GetHTMLPaths(): Record<string, string>;
```

- **Example**

```ts
const PluginFoo = () => ({
  setup(api) {
    api.modifyWebpackChain(() => {
      const htmlPaths = api.getHTMLPaths();
      console.log(htmlPaths); // { main: 'html/main/index.html' };
    });
  }
);
```
