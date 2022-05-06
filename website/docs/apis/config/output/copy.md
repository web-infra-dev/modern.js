---
sidebar_label: copy
---

# output.copy

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Array`
* 默认值： `undefined`

将指定的文件或目录拷贝到构建输出目录中。

例如，将 `src/assets` 下的文件直接拷贝到 dist 目录：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
});
```

`output.copy` 数组设置参考：[copy-webpack-plugin patterns](https://github.com/webpack-contrib/copy-webpack-plugin#patterns)。
