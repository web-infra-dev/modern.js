---
sidebar_label: path
---

# output.path



* 类型： `string`
* 默认值： `dist`


指定构建产物输出目录。

例如，可将构建产物输出目录改成 `build` 目录：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    path: 'build',
  },
});
```
