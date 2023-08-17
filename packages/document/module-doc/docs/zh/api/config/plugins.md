---
sidebar_position: 4
---

# plugins

本章介绍注册 Module Tools 插件的配置。

- 类型：`ModuleToolsPlugin[]`
- 默认值：`undefined`

## 插件执行顺序

默认情况下，自定义插件会按照 `plugins` 数组的顺序依次执行，Module Tools 内置插件的执行时机早于自定义插件。

当插件内部使用了控制顺序的相关字段，比如 `pre`、`post` 时，会基于声明的字段对执行顺序进行调整，详见 [插件之间的关系](https://modernjs.dev/guides/topic-detail/framework-plugin/relationship)。

## 开发插件

关于如何编写插件，可以查看[「插件编写指南」](/plugins/guide/getting-started)。

## 示例

### 使用 npm 上的插件

使用 npm 上的插件，需要通过包管理器安装插件，并通过 import 引入。

```js title="modern.config.ts"
import { myPlugin } from 'my-plugin';

export default defineConfig({
  plugins: [myPlugin()],
});
```

#### 使用本地插件

使用本地代码仓库中的插件，直接通过相对路径 import 引入即可。

```js title="modern.config.ts"
import { myPlugin } from './plugins/myPlugin';

export default defineConfig({
  plugins: [myPlugin()],
});
```

### 插件配置项

如果插件提供了一些自定义的配置项，你可以通过插件函数的参数传入配置。

```js title="modern.config.ts"
import { myPlugin } from 'my-plugin';

export default defineConfig({
  plugins: [
    myPlugin({
      foo: 1,
      bar: 2,
    }),
  ],
});
```
