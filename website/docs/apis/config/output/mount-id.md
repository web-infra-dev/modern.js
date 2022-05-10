---
sidebar_label: mountId
---

# output.mountId

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `root`

设置应用根组件挂载的 DOM 节点 `id`。

例如，修改 DOM 挂载节点 `id` 为 `app`：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    mountId: 'app',
  },
});
```

`yarn dev` 之后可以看到根组件会挂载到 id 为 "app" 的 div 标签：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/output-mount-id.png)


