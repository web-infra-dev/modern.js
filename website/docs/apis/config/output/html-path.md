---
sidebar_label: htmlPath
---

# output.htmlPath

:::info 适用的工程方案
MWA
:::

- 类型： `string`
- 默认值： `html`

设置 HTML 模板文件在构建产物目录中的相对路径。

## 示例

默认情况下，执行 `build` 之后， HTML 产物在 `dist` 目录下的结构如下：

```bash
/dist
└── html
    └── main
        └── index.html
```

在 `modern.config.js` 设置 `output.htmlPath` 为自定义的目录名：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    htmlPath: './html-assets',
  },
});
```

重新执行 `build` 命令，对应 HTML 产物在 dist 中的目录结构如下：

```bash
/dist
└── html-assets
    └── main
        └── index.html
```

:::info
如果需要移除 HTML 产物对应的文件夹，可以使用 [output.disableHtmlFolder](/docs/apis/config/output/disable-html-folder) 配置项。
:::
