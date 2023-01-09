1. Execute `pnpm new` and select "Enable BFF"
2. Add the following code to `modern.config.[tj]s` according to the chosen runtime framework：

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
