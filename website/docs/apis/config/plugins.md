---
title: plugins (插件)
sidebar_position: 9
---

# plugins (插件)

:::info 适用的工程方案
MWA，模块。
:::

- 类型： `CliPlugin[] | { cli: CliPlugin[] }`
- 默认值：`[]`

用于配置自定义插件。

自定义插件的编写方式请参考 [如何编写插件](/docs/guides/features/framework-plugin/implement)。

## 插件类型

Modern.js 中内置了三种不同的插件机制：

- `CLI 插件`，适用于本地开发、编译构建阶段，可以在命令行和编译阶段扩展各种能力。
- `Server 插件`，适用于服务端。
- `Runtime 插件`，适用于前端运行时。

目前 Modern.js 开放了自定义 CLI 插件的能力，Server 插件和 Runtime 插件会在后续开放。

## 插件执行顺序

默认情况下，自定义插件会按照 `plugins` 数组的顺序依次执行，Modern.js 内置插件的执行时机早于自定义插件。

当插件内部使用了控制顺序的相关字段，比如 `pre`、`post` 时，会基于声明的字段对执行顺序进行调整，详见 [插件之间的关系](/docs/guides/features/framework-plugin/relationship)。

## 示例

下面是 CLI 插件的使用示例。

### 使用 npm 上的插件

使用 npm 上的插件，需要通过包管理器安装插件，并通过 import 引入。

```ts title="modern.config.ts"
import MyPlugin from 'my-plugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

### 使用本地插件

使用本地代码仓库中的插件，直接通过相对路径 import 引入即可。

```ts title="modern.config.ts"
import MyPlugin from './config/plugin/MyPlugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

### 插件配置项

如果插件提供了一些自定义的配置项，可以通过插件函数的参数传入配置。

```ts title="modern.config.ts"
import MyPlugin from 'my-plugin';

export default defineConfig({
  plugins: [
    MyPlugin({
      foo: 1,
      bar: 2,
    }),
  ],
});
```
