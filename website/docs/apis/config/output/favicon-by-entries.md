---
sidebar_label: faviconByEntries
---

# output.faviconByEntries

:::info 适用的工程方案
MWA
:::

- 类型： `Object`
- 默认值： `undefined`

用于在多页面的场景下，为不同的页面设置不同的 favicon。

整体用法与 [output.favicon](/docs/apis/config/output/favicon) 一致，主要区别在于，可以使用「入口名称」作为 key 进行单独设置。

import EntryName from '@site/docs/components/entry-name.md'

<EntryName />

## 示例

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    favicon: './src/assets/default-favicon.png',
    faviconByEntries: {
      'page-a': './src/assets/page-a-favicon.png',
    },
  },
});
```

可以看到:

- 指定了入口 `page-a` 的 favicon 为 `./src/assets/page-a-favicon.png`。
- 入口 `page-b` 为 `output.favicon` 的设置: `./src/assets/default-icon.png`。
