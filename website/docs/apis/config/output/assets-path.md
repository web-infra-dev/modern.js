---
sidebar_label: assetsPath
sidebar_position: 2
---

# output.assetsPath

:::info 适用的工程方案
* 模块
:::

* 类型： `string`
* 默认值： `styles`

:::caution 注意
该配置即将在下一个大版本被废弃。

当要对 Bundleless 构建过程中的静态文件输出路径进行配置的时候，推荐使用下面的配置：
* [`output.buildConfig.bundlelessOptions.static.path`](/docs/apis/config/output/build-config/bundleless-options#path-1)。
:::

指定资源产物目录路径。

例如，可将资源产物输出目录改成 `assets-styles` 目录：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    assetsPath: 'assets-styles',
  },
});
```
