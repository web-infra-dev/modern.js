---
sidebar_label: disableSourceMap
---
# output.disableSourceMap



* 类型： `boolean`
* 默认值： `false`



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
