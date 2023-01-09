1. Execute `pnpm new` and select "Enable BFF"
2. Add the following code to `modern.config.[tj]s` according to the chosen runtime framework：

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="express" label="Express.js" default>

```ts title="edenx.config.ts"
import expressPlugin from '@edenx/plugin-express';
import bffPlugin from '@edenx/plugin-bff';

export default defineConfig({
  plugins: [expressPlugin(), bffPlugin()],
});
```

  </TabItem>
  <TabItem value="koa" label="Koa.js">

```ts title="edenx.config.ts"
import koaPlugin from '@edenx/plugin-koa';
import bffPlugin from '@edenx/plugin-bff';

export default defineConfig({
  plugins: [koaPlugin(), bffPlugin()],
});
```

  </TabItem>
</Tabs>
