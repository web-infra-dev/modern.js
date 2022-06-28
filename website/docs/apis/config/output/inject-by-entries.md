---
sidebar_label: injectByEntries
---

# output.injectByEntries

:::info 适用的工程方案
MWA
:::

- 类型： `Object`
- 默认值： `undefined`


用于在多页面的场景下，为不同的页面设置不同的 script 标签插入位置。

整体用法与 [output.inject](/docs/apis/config/output/inject) 一致，主要区别在于，可以使用「入口名称」作为 key 进行单独设置。

import EntryName from '@site/docs/components/entry-name.md'

<EntryName />

## 示例

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    inject: 'head',
    titleByEntries: {
      'page-a': 'false',
    },
  },
});
```

- 入口 `page-a` script 标签不会插入到 HTML 中。
- 入口 `page-b` script 标签会插入到 `head` 标签内。
