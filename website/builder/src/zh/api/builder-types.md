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

## BuilderTarget

Builder 构建产物的类型。

```ts
import { BuilderTarget } from '@modern-js/builder';
```

## BuilderContext

Builder 实例中 context 属性的类型定义。

```ts
import { BuilderContext } from '@modern-js/builder';

const context: BuilderContext = builder.context;
```
