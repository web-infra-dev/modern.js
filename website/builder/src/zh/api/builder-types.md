---
extractApiHeaders: [2]
---

# Builder Types

本章节描述了 Builder 提供的一些类型定义。

## BuilderInstance

Builder 实例的类型。

```ts
import type { BuilderInstance } from '@modern-js/builder';

let builder: BuilderInstance;
```

你可以通过泛型来传入 Provider 的类型，使 Builder 实例获得更准确的类型定义：

```ts
import type { createBuilder, type BuilderInstance } from '@modern-js/builder';
import type { BuilderWebpackProvider } from '@modern-js/builder-webpack-provider';

let builder: BuilderInstance<BuilderWebpackProvider>;
```

## BuilderContext

Builder 实例中 context 属性的类型定义。

```ts
import type { BuilderContext } from '@modern-js/builder';

const context: BuilderContext = builder.context;
```

## BuilderPlugin

Builder 插件的类型，需要配合 provider 中提供的 `BuilderPluginAPI` 类型来使用。

```ts
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

const myPlugin: BuilderPlugin<BuilderPluginAPI> = {
  name: 'my-plugin',
  setup() {},
};
```

## BuilderTarget

Builder 构建产物的类型。

```ts
import type { BuilderTarget } from '@modern-js/builder';
```

## BuilderEntry

对应 `createBuilder` 方法的 `entry` 选项的类型。

```ts
import type { BuilderEntry } from '@modern-js/builder';
```

## CreateBuilderOptions

对应 `createBuilder` 方法的入参类型。

```ts
import type { CreateBuilderOptions } from '@modern-js/builder';
```
