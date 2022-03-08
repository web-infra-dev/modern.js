---
sidebar_label: inject
sidebar_position: 35
---

# `output.inject`

:::info 适用的工程方案
* MWA
:::

* 类型： `'head' | 'body'| 'true' | false`
* 默认值： `body`


修改构建产物中 script 标签在 html 中的插入位置。对应选项说明如下：

* `head`: script 标签会默认在 html `head` 标签内。
* `body`: script 标签会默认在 html `body` 标签尾部。
* `true`: 和 `body` 表现相同。
* `false`: script 标签不插入 html 中。

配置如下时:

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    inject: 'head',
  },
});
```

`dev` 可以看到 script 标签会插入到 `head` 中：


![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/output-inject.png)

