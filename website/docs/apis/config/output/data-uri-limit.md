---
sidebar_label: dataUriLimit
---

# output.dataUriLimit

:::info 适用的工程方案
* MWA
:::

* 类型: `Number`
* 默认值: `10000` byte

图片、字体资源是否走 base64 的阈值，默认小于 10kb 会转成 base64 的形式加载，否则会生成独立的文件。

通过该选项可修改阈值, 如下修改为 20kb：

```js
module.exports = {
  output: {
    dataUriLimit: 20000,
  },
};
```

:::info 补充信息

在实际开发中，有些图片希望能无视尺寸大小，直接以内联或外链的方式使用，对此 Modern.js 提供了如下使用方式:

| 用法 | 解释     |
| -------- | --------- |
| `import logoUrl from './logo.png?inline'`  | 不管资源多大，都使用 base64 编码内联 |
| `import logoUrl from './logo.png?url'`| 不管资源多小，都使用外链方式加载 |

:::
