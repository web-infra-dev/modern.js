---
sidebar_label: favicon
---

# output.favicon

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `undefined`

设置页面的 favicon 图标。

例如以下配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    favicon: './src/assets/icon.png',
  },
});
```

`dev` 之后可以看到 html `head` 标签内生成如下 `link` 标签：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/output-favicon.png)
