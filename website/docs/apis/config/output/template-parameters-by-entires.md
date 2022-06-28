---
sidebar_label: templateParametersByEntries
---

# output.templateParametersByEntries

:::info 适用的工程方案
MWA
:::

用于在多页面的场景下，为不同的页面设置不同的 HTML 模板参数。

整体用法与 [output.templateParameters](/docs/apis/config/output/template-parameters) 一致，主要区别在于，可以使用「入口名称」作为 key 进行单独设置。

- 类型： `Record<string, unknown>`

import EntryName from '@site/docs/components/entry-name.md'

<EntryName />

## 示例

假设有以下需求：

- 为 `page-a` 设置参数 `type` 的值为 `a`。
- 为 `page-b` 设置参数 `type` 的值为 `b`。

可以添加如下配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    templateParametersByEntries: {
      'page-a': {
        type: 'a',
      },
      'page-b': {
        type: 'b',
      },
    },
  },
});
```
