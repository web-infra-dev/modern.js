---
sidebar_label: disableHtmlFolder
---

# output.disableHtmlFolder

:::info 适用的工程方案
MWA
:::

- 类型： `boolean`
- 默认值： `false`

移除 HTML 产物对应的文件夹。

开启该选项后，生成的 HTML 文件目录会从 `[name]/index.html` 变为 `[name].html`。

## 示例

默认情况下，执行 `build` 之后，HTML 产物在 `dist` 目录下的结构如下：

```bash
/dist
└── html
    └── main
        └── index.html
```

在 `modern.config.js` 中开启 `output.disableHtmlFolder` ：

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
└── html
    └── main.html
```

:::info
如果需要设置 HTML 模板文件在构建产物目录中的相对路径，可以使用 [output.htmlPath](/docs/apis/config/output/html-path) 配置项。
:::
