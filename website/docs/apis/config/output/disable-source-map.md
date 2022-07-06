---
sidebar_label: disableSourceMap
---
# output.disableSourceMap

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

:::caution 注意
模块工程方案的下一个大版本将废弃此配置，推荐使用 [`output.buildConfig.sourceMap`](/docs/apis/config/output/build-config/source-map) 代替。更多内容请阅读 【[如何构建模块](/docs/guides/features/modules/build)】。
:::


默认情况下，Modern.js 在生产环境下会生成 JS 和 CSS 资源的 SourceMap，用于调试和排查线上问题。

如果项目在生产环境下不需要 SourceMap，可以关闭该功能，从而提升 build 构建的速度。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableSourceMap: true,
  },
});
```
