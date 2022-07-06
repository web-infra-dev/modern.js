---
sidebar_label: target
---

# buildConfig.target

:::info 适用的工程方案
* 模块
:::

* 类型： `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext'`
* 默认值： `'esnext'`

设置构建产物支持的最高 ECMAScript 版本。如果使用了更高的版本语法，会进行编译转换。

:::caution
当前 Bundle 构建支持 `es5` 到 `esnext` 的语法。Bundleless 目前暂时仅支持 `es5` 和 `es6`，所有 `es6+` 的语法，都会转换为 `es6`。
:::


```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      target: 'esnext',
    },
  },
});
```
