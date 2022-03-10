---
sidebar_position: 2
---

# 如何编写插件

在 Modern.js 中支持开发者自定义插件，不同的工程方案中支持的插件不同。具体可以看【[Hook API](/docs/apis/runtime/plugin/abstruct)】。

## 实现插件

创建插件都是通过各个 Manager 的 `createPlugin` 方法来创建的，形式是：

:::note 注
关于 Manager 是什么，可以阅读 【[插件 API - 概览](/docs/apis/runtime/plugin/abstruct)】以及【[Manager](/docs/apis/runtime/plugin/manager)】。
:::

```ts
const plugin = createPlugin(() => {
  // do somethings in plugin initialization

  return {
    prepare: () => {
      // do somethings in prepare progress
    },
  };
});
```

这里的 `prepare` 是 Hook 模型的中间件函数。

:::note 注
所有的插件 Hook 都是函数，但管理它们的模型不一样，导致他们的运行规则也不一样，具体看：[Hook 模型](/docs/apis/runtime/plugin/hook) API。
:::

## 添加插件

开发者自定义插件的添加方式可以查看：【[plugins (框架插件)](/docs/apis/config/plugins)】。这里会介绍关于 Modern.js 中推荐的插件的实现和添加流程。

### 开发本地插件

本地插件 Modern.js 中推荐写在 `config/plugin` 目录下：

```ts title=config/plugin/foo.ts
import { createPlugin } from '@modern-js/core'

export default createPlugin(() => {
  return {
    /** some hook middleware */
  };
});
```

然后将它的文件地址添加到 `modern.config.ts` 中：

```ts title="modern.config.ts"
export default defineConfig({
  plugins: [
    {
      cli: require.resolve('./config/plugin/foo.ts'),
    },
  ],
});
```

### 在 npm 上发布插件

如果需要开发 Modern.js 插件并将其发布到 npm，推荐使用 Modern.js 中的模块工程方案来管理和构建，如果需要将它和使用项目管理在一起，则推荐使用 Modern.js 中的 Monorepo 工程方案管理。这里就简单的使用模块工程方案演示一下。

首先根据【[项目创建](/docs/guides/features/modules/create-project)】创建一个空的模块工程方案项目，调整项目名称：

```json
{
  "name": "custom-plugin"
  ...
}
```

然后新建对应的插件文件：

```ts title=config/plugin/index.ts
import { createPlugin } from '@modern-js/core'

export default createPlugin(() => {
  return {
    /** some hook middleware */
  };
});
```

发布之后，安装到需要使用的项目 `pnpm add custom-plugin`，这里以一个应用项目为例，然后在 `modern.config.ts` 中添加：

```ts title="modern.config.ts"
export default defineConfig({
  plugins: [
    {
      cli: require.resolve('custom-plugin'),
    },
  ],
});
```

当开发者发现插件方面的空缺，欢迎通过这种方式来一起建设 Modern.js 插件生态。
