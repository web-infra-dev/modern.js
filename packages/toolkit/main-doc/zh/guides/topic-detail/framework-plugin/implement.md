---
title: 如何编写插件
sidebar_position: 3
---

上一小节介绍了 Modern.js 插件的 Hook 模型，这一小节介绍如何编写插件。

## 实现插件

Modern.js 插件是一个对象，对象包含以下属性：

- `name`: 插件的名称，唯一标识符。
- `setup`: 插件初始化函数，只会执行一次。setup 函数可以返回一个 Hooks 对象，Modern.js 会在特定的时机执行这些 Hooks。

```ts
const MyPlugin = {
  name: 'my-plugin',

  setup() {
    // 执行一些初始化逻辑
    const foo = '1';

    // 返回一个 Hooks 对象
    return {
      afterBuild: () => {
        // 在构建完成后执行逻辑
      },
    };
  },
};
```

另外，在插件中，允许配置与其他插件的执行顺序，详情可以参考[插件关系](/docs/guides/topic-detail/framework-plugin/relationship)。

### 插件类型

使用 TypeScript 时，可以引入内置的 `CliPlugin` 类型，为插件提供正确的类型推导：

```ts
import type { CliPlugin } from '@modern-js/core';

const MyPlugin: CliPlugin = {
  name: 'my-plugin',

  setup() {
    const foo = '1';

    return {
      afterBuild: () => {
        // 在构建完成后执行逻辑
      },
    };
  },
};
```

Modern.js 导出的 `Plugin` 类型支持泛型扩展。

在 Modern.js 中，任意插件可以注册自己的 Hook，如果想拥有其他插件注册的 Hook 的类型，可以添加泛型：

```ts
import type { CliPlugin } from '@modern-js/core';
import type { MyPluginHook } from 'xxx';

const MyPlugin: CliPlugin<MyPluginHook> = {};
```

详细说明，请参考 [扩展 Hook](/docs/guides/topic-detail/framework-plugin/extend)。


### 插件配置项

**建议将插件写成函数的形式**，使插件能通过函数入参来接收配置项：

```ts
import type { CliPlugin } from '@modern-js/core';

type MyPluginOptions = {
  foo: string;
};

const MyPlugin = (options: MyPluginOptions): CliPlugin => ({
  name: 'my-plugin',

  setup() {
    console.log(options.foo);
  },
});
```

### 插件 API

插件的 `setup` 函数会接收一个 api 入参，你可以调用 api 上提供的一些方法来获取到配置、应用上下文等信息。

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  setup(api) {
    // 获取应用原始配置
    const config = api.useConfigContext();
    // 获取应用运行上下文
    const appContext = api.useAppContext();
    // 获取解析之后的最终配置
    const resolvedConfig = api.useResolvedConfigContext();
  },
});
```

插件 API 的详细说明，请参考 [Plugin API](/docs/guides/topic-detail/framework-plugin/plugin-api)。

### 异步 setup

CLI 插件的 setup 可以是一个异步函数，在初始化过程中执行异步逻辑。

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  async setup(api) {
    await doSomething();
  },
});
```

## 添加插件

自定义插件的使用方式可以查看：[plugins (框架插件)](/docs/configure/app/plugins)。下面会介绍 Modern.js 中推荐的插件实现方法。

### 开发本地插件

本地插件推荐写在 `config/plugin` 目录下，并通过 `export default` 导出：

```ts title=config/plugin/MyPlugin.ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  setup() {
    // 插件初始化
  },
});
```

然后在 `modern.config.ts` 中注册对应的插件：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';
import MyPlugin from './config/plugin/MyPlugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

### 在 npm 上发布插件

如果需要将 Modern.js 插件发布到 npm，推荐使用 Modern.js 中的模块工程方案来管理和构建。

首先创建一个空的模块工程方案项目，调整 npm 包名称：

```json
{
  "name": "my-plugin"
  ...
}
```

然后新建对应的插件文件：

```ts title=src/index.ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  setup() {
    // 插件初始化
  },
});
```

发布之后，安装到需要使用的项目 `pnpm add my-plugin`，这里以一个应用项目为例，然后在 `modern.config.ts` 中添加：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';
import MyPlugin from 'my-plugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

如果你发现目前 Modern.js 存在无法满足的场景，欢迎通过**编写自定义插件的方式**来一起建设 Modern.js 生态。
