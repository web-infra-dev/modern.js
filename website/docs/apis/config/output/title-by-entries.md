---
sidebar_label: titleByEntries
---

# output.titleByEntries

:::info 适用的工程方案
MWA
:::

- 类型： `Object`
- 默认值： `undefined`

用于在多页面的场景下，为不同的页面设置不同的 `title`。

整体用法与 [output.title](/docs/apis/config/output/title) 一致，主要区别在于，可以使用「入口名称」作为 key 进行单独设置。

import EntryName from '@site/docs/components/entry-name.md'

<EntryName />

## 示例

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    title: '今日头条',
    titleByEntries: {
      'page-a': '抖音',
    },
  },
});
```

可以看到入口 `page-a` 的 `title` 值为「 抖音 」，

其他入口，如 `page-b` 的 `title` 会被设置为 `output.title` 即「 今日头条 」。
