---
sidebar_label: htmlPath
sidebar_position: 22
---
# `output.htmlPath`

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `html`


设置 html 模板文件在输出目录中的相对路径。

默认情况下，执行 `build` 之后， html 产物在 `dist` 目录下的结构如下：

```bash
├── html
│   └── main
│       └── index.html
```

在 `modern.config.js` 设置 `output.htmlPath` 之后：

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    htmlPath: './html-assets',
  },
});
```

重新执行 `build` 命令，对应 css 产物在 dist 中的目录结构如下：

```bash
.
├── html-assets
│   └── main
│       └── index.html
```
