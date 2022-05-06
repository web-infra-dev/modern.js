---
sidebar_label: cssPath
---

# output.cssPath

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `static/css`


设置 css 文件在输出目录中的相对路径。

默认情况下, `build` 之后， css 产物在 `dist` 目录下的结构如下：

```bash
├── static
│   ├── css
│   │   ├── main.7987216f.chunk.css
│   │   └── main.7987216f.chunk.css.map
```

在 `modern.config.js` 设置 `output.cssPath` 之后：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    cssPath: './css-assets',
  },
});
```

重新执行 `build`，对应 css 产物在 `dist` 中的目录结构如下：

```bash
.
├── css-assets
│   ├── main.7987216f.chunk.css
│   └── main.7987216f.chunk.css.map
```
