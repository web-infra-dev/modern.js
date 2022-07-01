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

设置打包模块的入口，key为产物名称，value为入口地址。

## splitting

* 类型： `boolean`
* 默认值： `false`

设置是否开启代码分割，这允许你将打包产物分割成独立的chunk。

## platform

* 类型：`'node' | 'browser'`
* 默认值： `'node'`

设置构建环境，值为**node**时构建器会自动将Nodejs的内置模块进行external，而**browser**则会bundle这些模块，为保证打包后的程序可以正常运行，你需要自己为这些内置模块提供polyfill版本。

## minify

* 类型：`false | 'terser' | 'esbuild'`
* 默认值： `false`

设置代码压缩方式，支持[terser](https://github.com/terser/terser)和[esbuild minify](https://esbuild.github.io/api/#minify)两种压缩方式。

## externals

* 类型： `(string | RegExp)[]`
* 默认值： `[]`

设置外置依赖，打包器将会跳过外置依赖的打包。

## skipDeps

* 类型： `boolean`
* 默认值： `true`

设置是否跳过对三方依赖的打包，默认开启，即跳过所有package.json里定义的dependencies,devDependencies,peerDependencies的打包，
将其加入到externals数组中。

