---
sidebar_label: disableTsChecker
---

# output.disableTsChecker



- 类型： `boolean`
- 默认值： `false`

默认情况下，Modern.js 集成了 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) 插件，进行 TypeScript 语法检查。

开启此配置项可以关闭该插件。

## 示例

为了保证生产环境的代码安全，建议仅在开发环境下开启此配置项：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableTsChecker: process.env.NODE_ENV === 'development',
  },
});
```
