---
sidebar_label: target
---

# buildConfig.target

:::info 适用的工程方案
* 模块
:::

* 类型： `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext'`
* 默认值： `'es2018'`

用于对于 es syntax 的校验，如果使用了高版本语法，会进行报错。

:::info
当前 bundle 支持 es5 到 esnext的语法。bundleless 目前暂时支持 es5 和 es6，所有 es6+ 的语法，暂时会转换为 es6。
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
