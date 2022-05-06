---
sidebar_label: polyfill
---

# output.polyfill

:::info 适用的工程方案
MWA。
:::

- 类型： `'entry' | 'usage' | 'ua' | 'off'`
- 默认值：`'entry'`

通过 `output.polyfill` 可以配置 Polyfill 的注入方式。

## 配置项

### entry

根据项目的 Browserslist 配置范围，自动在入口文件中引入所需的 Polyfill 代码。

等同于 [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) 的 `useBuiltIns: 'entry'` 选项。

### usage

根据代码中使用到的语法，按需注入所需的 Polyfill 代码。

等同于 [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) 的 `useBuiltIns: 'usage'` 选项。

### ua

基于 Modern.js 内置服务器，根据当前请求的 UA 信息，动态下发 Polyfill 代码，

使用此选项前，需要使用微生成器开启基于 UA 的 Polyfill 功能。

### off

关闭 Polyfill，不注入任何 Polyfill 代码。

使用此选项时，需要自行保证代码的兼容性。

:::info
关于 Polyfill 的详细介绍，比如配置项之间的区别、UA 模式、Browserslist 配置等，可以查看[客户端兼容性](/docs/guides/usages/compatibility)。
:::

## 示例

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    polyfill: 'usage',
  },
});
```
