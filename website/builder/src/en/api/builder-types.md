---
extractApiHeaders: [2]
---

# Builder Types

This section describes some of the type definitions provided by the Builder.

## BuilderInstance

The type of the Builder instance.

```ts
import { BuilderInstance } from '@modern-js/builder';

const builder: BuilderInstance = await createBuilder(provider, {});
```

## BuilderContext

The type of the context property in the Builder instance.

```ts
import { BuilderContext } from '@modern-js/builder';

const context: BuilderContext = builder.context;
```

## BuilderPlugin

The type of Builder plugin, should be used with the `BuilderPluginAPI` type exported from the provider.

```ts
import { BuilderPlugin } from '@modern-js/builder';
import { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

const myPlugin: BuilderPlugin<BuilderPluginAPI> = {
  name: 'my-plugin',
  setup() {},
};
```

## BuilderTarget

The type of build target.

```ts
import { BuilderTarget } from '@modern-js/builder';
```

## BuilderEntry

The type of the `entry` option to the `createBuilder` method.

```ts
import { BuilderEntry } from '@modern-js/builder';
```

## CreateBuilderOptions

The param type of `createBuilder` method.

```ts
import { CreateBuilderOptions } from '@modern-js/builder';
```
