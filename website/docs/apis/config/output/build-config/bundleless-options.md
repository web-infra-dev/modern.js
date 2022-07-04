---
sidebar_label: bundlelessOptions
---

# buildConfig.bundlelessOptions

:::info 适用的工程方案
* 模块
:::

`bundlelessOptions` 用来定制 Bundleless 构建相关的配置，当 `{ buildType: 'bundleless' }` 的时候，该配置才会生效。

> 默认情况下，[`buildType`](/docs/apis/config/output/build-config/build-type) 的值为 `bundleless`，因此可以直接配置 `bundlelessOptions`。

下面是一个配置示例：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
        // 默认值为 `bundleless`
        buildType: 'bundleless',
        bundlelessOptions: {
          // 设置 bundleless 构建的入口目录
          sourceDir: 'src',
          // 设置 bundleless 样式构建的配置
          style: {
            // 设置如何处理样式文件
            compilerMode: 'only-compiled-code',
            // 设置样式构建产物的输出位置
            path: './styles',
          },
          // 设置 bundleless 对静态文件处理的配置
          static: {
            // 设置静态资源的输出位置
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

设置构建的源码目录。

## style

样式产物相关配置

### compileMode

* 类型： `'all' | 'only-compiled-code' | 'only-source-code' | false`
* 默认值： `'all'`

设置处理样式模式：

`'only-compiled-code'`：只编译源码。产物目录仅包含编译后的样式产物。

`'only-source-code'`：只复制源码。产物目录仅包含源码。

`'all'`：编译源码，同时也复制源码。产物目录同时包含源码和编译后的样式产物。

`'false'`：对样式不做任何处理。

### path

* 类型： `string`
* 默认值： `'./'`

设置样式产物输出的路径。路径相对于 [`buildConfig.outputPath`](/docs/apis/config/output/build-config/output-path) 的值。

## static

静态文件产物相关配置。

### path

* 类型： `string`
* 默认值： `'./'`

设置静态文件产物输出的路径。路径相对于 [`buildConfig.outputPath`](/docs/apis/config/output/build-config/output-path) 的值。
