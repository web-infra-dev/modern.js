1. 执行 `pnpm new`，选择启用 BFF
2. 根据选择的运行时框架，将下面的代码添加到 `modern.config.[tj]s` 中：

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="express" label="Express.js" default>

```ts title="edenx.config.ts"
import ExpressPlugin from '@edenx/plugin-express';
import BffPlugin from '@edenx/plugin-bff';

export default defineConfig({
  plugins: [ExpressPlugin(), BffPlugin()],
});
```

  </TabItem>
  <TabItem value="koa" label="Koa.js">

```ts title="edenx.config.ts"
import KoaPlugin from '@edenx/plugin-koa';
import BffPlugin from '@edenx/plugin-bff';

export default defineConfig({
  plugins: [KoaPlugin(), BffPlugin()],
});
```

  </TabItem>
</Tabs>
