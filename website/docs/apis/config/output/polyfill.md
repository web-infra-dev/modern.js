---
sidebar_label: polyfill
sidebar_position: 8
---

# `output.polyfill`

:::info 适用的工程方案

* MWA
:::

* 类型： `'usage' | 'ua'`
* 默认值：`undefined`

配置应用的 polyfill，例如：

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    polyfill: 'ua',
  },
});
```

默认情况下会根据项目 BrowserList 的设置情况引入所需的 Polyfill 代码。

当设置为 `usage` 时，会根据代码中使用到的语法引入 Polyfill 代码。

当设置为 `ua` 时，Modern.js 内置服务器会根据当前请求的 UA 信息动态下发 Polyfill 代码。（需使用微生成器开启基于 UA 的 Polyfill 功能）。

更多内容可以查看[客户端兼容性](/docs/guides/usages/basic-configuration/compatibility)。
