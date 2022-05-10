---
sidebar_label: disableAssetsCache
---

# output.disableAssetsCache

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

默认情况下生产环境构建产物会带有 hash 后缀：

```bash
  File                                     Size         Gzipped
  dist/static/css/187.7879e19d.css         126.99 KB    9.17 KB
  dist/static/js/runtime-main.0932c84c.js    6.52 KB      1.66 KB
  dist/static/js/main.18a568e5.js            2.24 KB      922 B
```

禁用静态资源输出名带 hash 后缀, 配置如下即可：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableAssetsCache: true,
  },
});
```

构建产物如下:

```bash
  File                            Size         Gzipped
  dist/static/css/187.css         126.99 KB    9.17 KB
  dist/static/js/runtime-main.js    6.52 KB      1.66 KB
  dist/static/js/main.js            2.24 KB      922 B
```
