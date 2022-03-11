---
sidebar_label: metaByEntries
sidebar_position: 5
---

# `output.metaByEntries`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `undefined`

按入口设置 `meta` 信息，对象的 `key` 为入口名，给定值会和 `output.meta` 合并。

:::note 注
「 入口名 」默认为目录名，少数情况下通过 `source.entries` 自定义入口时，入口名为 `source.entries` 对象的 `key`。
:::


例如， 项目目录结构和配置如下时：

```javascript title="目录结构"
.
└── src
    ├── page-a
    │   └── App.jsx
    └── page-b
        └── App.jsx
```

```javascript title="modern.config.js"
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

* page-a

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
//...
<meta name="description" content="抖音">
```

* page-b

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
//...
<meta name="description" content="今日头条">
```

可以看到入口 `page-a` 的 `description` meta 标签被自定义为 `抖音`。 入口 `page-a` 和 `page-b` 都修改了 `viewport` meta 标签。

`output.metaByEntries` 在多入口项目需要指定某些入口的 meta 信息时非常方便。

