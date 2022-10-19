---
extractApiHeaders: [2]
---

# Builder Types

本章节描述了 Builder 提供的一些类型定义。

## BuilderInstance

Builder 实例的类型。

```ts
import { BuilderInstance } from '@modern-js/builder';

const builder: BuilderInstance = await createBuilder(provider, {});
```

## BuilderContext

Builder 实例中 context 属性的类型定义。

```ts
import { BuilderContext } from '@modern-js/builder';

const context: BuilderContext = builder.context;
```

## BuilderPlugin

Builder 插件的类型，需要配合 provider 中提供的 `BuilderPluginAPI` 类型来使用。

```ts
import { BuilderPlugin } from '@modern-js/builder';
import { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

const myPlugin: BuilderPlugin<BuilderPluginAPI> = {
  name: 'my-plugin',
  setup() {},
};
```

## BuilderTarget

Builder 构建产物的类型。

```ts
import { BuilderTarget } from '@modern-js/builder';
```

## BuilderEntry

对应 `createBuilder` 方法的 `entry` 选项的类型。

```ts
import { BuilderEntry } from '@modern-js/builder';
```

## CreateBuilderOptions

对应 `createBuilder` 方法的入参类型。

```ts
import { CreateBuilderOptions } from '@modern-js/builder';
```
