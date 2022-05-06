---
sidebar_label: mediaPath
---

# output.mediaPath

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `static/media`

设置资源文件（(图片、字体、媒体资源等）在输出目录中的相对路径。

默认情况下，执行 `yarn build` 之后， 图片资源在 `dist` 目录下的结构如下：

```bash
├── static
│   └── media
│       └── logo.b07f4339.png
```

在 `modern.config.js` 设置 `output.mediaPath` 之后：


```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    mediaPath: './media-assets',
  },
});
```

重新执行 `build`，对应图片资源在 dist 中的目录结构如下：

```bash
├── media-assets
│   ├── exclude.934823cb.less
│   └── logo.b07f4339.png
```
