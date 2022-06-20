---
sidebar_label: disableTsChecker
---

# output.disableTsChecker

:::info
适用的工程方案：
MWA，模块。
:::

- 类型： `boolean`
- 默认值： `false`

:::warning 警告
模块工程方案的下一个版本将废弃此配置，使用[output.buildConfig.enableDts](/docs/apis/config/output/build-config/enable-dts)代替
:::

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
