---
sidebar_label: sourceMap
---

# buildConfig.sourceMap

:::info 适用的工程方案
* 模块
:::

* 类型： `boolean | 'inline' | 'external'`
* 默认值： bundle时为`true`,等同于`'external'`,bundleless时为`false`


设置生成source map的形式

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
      sourceMap: false,
    },
  },
});
```

