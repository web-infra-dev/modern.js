---
sidebar_label: enableModernMode
---

# output.enableModernMode

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值：`false`

用于配置入口产物形态：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableModernMode: true,
  },
});
```

设置 `output.enableModernMode` 后， 生产环境会自动构建出针对现代浏览器语法未降级的 js 产物和针对旧版本浏览器带有 Polyfill 的 js 产物:

更多内容可以查看[客户端兼容性](/docs/guides/usages/compatibility)。
