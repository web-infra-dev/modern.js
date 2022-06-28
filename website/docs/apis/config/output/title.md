---
sidebar_label: title
---

# output.title

:::info 适用的工程方案
MWA
:::

- 类型： `string`
- 默认值： `undefined`

配置 HTML 页面的 title 标签，例如：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    title: 'example',
  },
});
```
