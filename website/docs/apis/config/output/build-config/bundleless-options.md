---
sidebar_label: bundlelessOptions
---

# buildConfig.bundlelessOptions

:::info 适用的工程方案
* 模块
:::

bundlelessOptions用来定制一些当buildType为**bundleless**时使用到的特定参数

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: 'src',
          style: {
            compilerMode: 'only-compiled-code',
            path: './styles',
          },
          static: {
            path: './public',
          }
        }
      }
    },
  },
});
```

## sourceDir

* 类型： `string`
* 默认值： `'src'`

设置构建的源码目录

## style
样式产物相关配置

### compileMode
* 类型： `'all' | 'only-compiled-code' | 'only-source-code' | false`
* 默认值： `'all'`

设置编译模式

`'only-compiled-code'`：产物目录只包含编译后的代码

`'only-source-code'`：产物目录只包含源码

`'all'`：产物目录里源码和编译后的代码都包含

`'false'`：关闭编译

### path
* 类型： `string`
* 默认值： `'./'`

设置样式产物输出的位置，位置相对于 `buildConfig.outputPath`

## static
静态文件产物相关配置

### path
* 类型： `string`
* 默认值： `'./'`

设置静态文件产物输出的位置，位置相对于 `buildConfig.outputPath`
