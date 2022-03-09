---
sidebar_label: enableTsLoader
---
# `output.enableTsLoader`

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

开启该选项后，会使用 `ts-loader` 编译 ts 文件：

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableTsLoader: true,
  },
});
```

:::note 注
默认情况下，Modern.js 使用 Babel 编译 TS 文件，由于一些已知问题例如：

* 不支持 const enum
* 不支持 export=、import=
* ...

当需要使用上述特性或有其他需要的情况下，可通过该选项使用 ts-loader 编译 TS 文件。
:::
