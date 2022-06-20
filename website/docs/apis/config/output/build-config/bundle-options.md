---
sidebar_label: bundleOptions
---

# buildConfig.bundleOptions

:::info 适用的工程方案
* 模块
:::

bundleOptions用来定制一些当buildType为**bundle**时使用到的特定参数

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
      bundleOptions: {
        entry: {
          'index.min': './src/index.ts',
        },
        splitting: true,
        platform: 'node',
        minify: 'terser',
        externals: ['react']
      }
    },
  },
});
```

## entry

* 类型： `Record<string, string>`
* 默认值： `'{ index: './src/index.ts' }'`

设置打包模块的入口，key为产物名称，value为入口地址

## splitting

* 类型： `boolean`
* 默认值： `false`

设置是否开启代码分割

## platform

* 类型：`'node' | 'browser'`
* 默认值： `'node'`

设置构建环境，**node**时构建器会自动将Nodejs的内置模块进行external，而**browser**则会bundle这些模块，所以你需要自己为这些内置模块提供polyfill版本

## minify

* 类型：`false | 'terser' | 'esbuild'`
* 默认值： `false`

设置代码压缩方式

## externals

* 类型： `(string | RegExp)[]`
* 默认值： `[]`

设置外置依赖，不设置时默认打包所有三方依赖
