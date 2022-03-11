---
sidebar_label: titleByEntries
sidebar_position: 3
---

# `output.titleByEntries`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `undefined`

按入口设置 html 页面 `title` 标签，对象的 `key` 为入口名。


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
    title: '今日头条',
    titleByEntries: {
      'page-a': '抖音',
    },
  },
});
```


可以看到入口 `page-a` 的 `title` 值为「 抖音 」，

其他入口，如 `page-b` 的 `title` 会被设置为 `output.title` 即「 今日头条 」。

`output.titleByEntires` 在多入口的场景下自定义某些入口的 `title` 时会非常方便
