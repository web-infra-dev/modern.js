---
sidebar_label: metaByEntries
---

# output.metaByEntries

:::info 适用的工程方案
MWA
:::

- 类型： `Object`
- 默认值： `undefined`

用于在多页面的场景下，为不同的页面设置不同的 meta 信息。

整体用法与 [output.meta](/docs/apis/config/output/meta) 一致，主要区别在于，可以使用「入口名称」作为 key 进行单独设置。

import EntryName from '@site/docs/components/entry-name.md'

<EntryName />

## 示例

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    meta: {
      viewport: 'width=device-width',
      description: '今日头条',
    },
    metaByEntries: {
      'page-a': {
        description: '抖音',
      },
    },
  },
});
```

`dev` 之后可以看到入口 `page-a` 和 入口 `page-b` 的 meta 信息分别如下:

- page-a

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
//...
<meta name="description" content="抖音" />
```

- page-b

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
//...
<meta name="description" content="今日头条" />
```

可以看到入口 `page-a` 的 `description` meta 标签被自定义为 `抖音`。 入口 `page-a` 和 `page-b` 都修改了 `viewport` meta 标签。
