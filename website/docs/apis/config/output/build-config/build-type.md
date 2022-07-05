---
sidebar_label: buildType
---

# buildConfig.buildType

:::info 适用的工程方案
* 模块
:::

* 类型： `'bundle'|'bundleless'`
* 默认值： `'bundleless'`

设置模块的构建方式，是否需要对产物进行打包。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
    },
  },
});
```

:::tip 提示
Bundleless 构建是指对所有的源代码文件进行单独编译，不进行打包，最终输出的产物目录结构与源文件目录结构是一一对应的。

而 Bundle 构建是指打包构建，以 `index.(j|t)s` 为入口打包生成单个 Bundle 文件。生成的产物类似于 [webpack](https://webpack.js.org/) 打包出来的产物。
:::
