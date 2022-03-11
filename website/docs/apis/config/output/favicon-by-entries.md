---
sidebar_label: faviconByEntries
sidebar_position: 7
---

# `output.faviconByEntries`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `undefined`

按入口设置网页的 favicon。

:::note 注
「 入口名 」默认为目录名，少数情况下通过 `source.entries` 自定义入口时，入口名为 `source.entries` 对象的 `key`。
:::

例如，目录结构和配置如下时:

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
    favicon: './src/assets/default-favicon.png',
    faviconByEntries: {
      'page-a': './src/assets/page-a-favicon.png',
    },
  },
});
```

可以看到:
* 指定了入口 `page-a` 的 favicon 为 `./src/assets/page-a-favicon.png`。
* 入口 `page-b` 为 `output.favicon` 的设置: `./src/assets/default-icon.png`。



