---
sidebar_label: injectByEntries
sidebar_position: 36
---

# `output.injectByEntries`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `undefined`


按入口设置 script 标签插入位置，对象的 `key` 为入口名，对应的值设置参考 [`output.inject`](./inject)。


:::note 注
「 入口名 」默认为目录名，少数情况下通过 `source.entries` 自定义入口时，入口名为 `source.entries` 对象的 `key`。
:::

例如，项目目录结构和 `modern.config.js` 如下时：

```javascript title="项目目录结构"
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
    inject: 'head',
    titleByEntries: {
      'page-a': 'false',
    },
  },
});
```

入口 `page-a` script 标签不会插入到 html 中, 入口 `page-b` script 标签会插入到 `head` 标签内

