---
sidebar_position: 1
---

# 深入理解构建

在 "基础使用" 的部分，我们已经知道可以通过 `buildConfig` 配置对项目的输出产物进行修改。`buildConfig` 不仅描述了产物的一些特性，同时还为构建产物提供了一些功能。

:::tip
如果你还不了解 `buildConfig` 的作用，请先阅读 [修改输出产物](/guide/basic/modify-output-product)。
:::

而在本章里我们将要深入理解某些构建配置的作用以及了解执行 `modern build` 命令的时候发生了什么。

## `bundle` / `bundleless`

那么首先我们来了解一下 bundle 和 bundleless。

所谓 bundle 是指对构建产物进行打包，构建产物可能是一个文件，也有可能是基于一定的[代码拆分策略](https://esbuild.github.io/api/#splitting)得到的多个文件。

而 bundleless 则是指对每个源文件单独进行编译构建，但是并不将它们打包在一起。每一个产物文件都可以找到与之相对应的源码文件。**bundleless 构建的过程，也可以理解为仅对源文件进行代码转换的过程**。

它们有各自的好处：

- bundle 可以减少构建产物的体积，也可以对依赖预打包，减小安装依赖的体积。提前对库进行打包，可以加快应用项目构建的速度。
- bundleless 则是可以保持原有的文件结构，更有利于调试和 tree shaking。

:::warning
bundleless 是单文件编译模式，因此对于类型的引用和导出你需要加上 `type` 字段， 例如 `import type { A } from './types`
:::

在 `buildConfig` 中可以通过 [`buildConfig.buildType`](/api/config/build-config#buildtype) 来指定当前构建任务是 bundle 还是 bundleless。

## `input` / `sourceDir`

[`buildConfig.input`](/api/config/build-config#input) 用于指定读取源码的文件路径或者目录路径，其默认值在 bundle 和 bundleless 构建过程中有所不同：

- 当 `buildType: 'bundle'` 的时候，`input` 默认值为 `src/index.(j|t)sx?`
- 当 `buildType: 'bundleless'` 的时候，`input` 默认值为 `['src']`

从默认值上我们可以知道：**使用 bundle 模式构建时一般指定一个或多个文件作为构建的入口，而使用 bundleless 构建则是指定一个目录，将目录下所有文件作为入口**。

[`sourceDir`](/api/config/build-config#sourcedir) 用于指定源码目录，它**只与**以下两个内容有关系：

- 类型文件生成
- 指定构建过程中的 [`outbase`](https://esbuild.github.io/api/#outbase)

因此我们可以得到其最佳实践：

- **在 bundle 构建过程中，只能指定 `input` 。**
- **一般情况下，bundleless 只需要指定 `sourceDir`（此时 `input` 会与 `sourceDir` 保持一致）。**

如果我们想要在 bundleless 里只对一部分文件进行转换，例如只需要转换 `src/runtime` 目录的文件，此时需要配置 `input`:

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    input: ['src/runtime'],
    sourceDir: 'src',
  },
});
```

## 使用 swc

在部分场景下，Esbuild 不足以满足我们的需求，此时我们会使用 SWC 来做代码转换，主要有以下几个场景:

- [transformImport](/api/config/build-config#transformimport)
- [transformLodash](/api/config/build-config#transformlodash)
- [externalHelpers](/api/config/build-config#externalhelpers)
- [format: umd](api/config/build-config#format-umd)
- [target: es5](api/config/build-config#target)
- [emitDecoratorMetadata: true](https://www.typescriptlang.org/tsconfig#emitDecoratorMetadata)

## 类型文件生成

[`buildConfig.dts`](/api/config/build-config#dts) 配置主要用于类型文件的生成。

### 关闭类型生成

默认情况下类型生成功能是开启的，如果需要关闭的话，可以按照如下配置：

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    dts: false,
  },
});
```

:::tip
关闭类型文件后，一般来说构建速度会有所提升。
:::

### 打包类型文件

在 `buildType: 'bundleless'` 的时候，类型文件的生成是使用项目的 `tsc` 命令来完成生产。

**Modern.js Module 同时还支持对类型文件进行打包**，不过使用该功能的时候需要注意：

- 一些第三方依赖存在错误的语法会导致打包过程失败。因此对于这种情况，需要手动通过 [`buildConfig.externals`](/api/config/build-config#externals) 将这类第三方包排除。
- 对于第三方依赖的类型文件指向的是一个 `.ts` 文件的情况，目前无法处理。比如第三方依赖的 `package.json` 中存在这样的内容： `{"types": "./src/index.ts"}`。

### 别名转换

在 bundleless 构建过程中，如果源代码中出现了别名，例如：

```js title="./src/index.ts"
import utils from '@common/utils';
```

正常来说，使用 `tsc` 生成的产物类型文件也会包含这些别名。不过 Modern.js Module 会对 `tsc` 生成的类型文件里的别名进行转换处理：

- 对于类似 `import '@common/utils'` 或者 `import utils from '@common/utils'` 这样形式的代码可以进行别名转换。
- 对于类似 `export { utils } from '@common/utils'` 这样形式的代码可以进行别名转换。

然而也存在一些情况，目前还无法处理，例如 `Promise<import('@common/utils')>` 这样形式的输出类型目前无法进行转换。
对于这种情况的解决办法，可以参与[讨论](https://github.com/web-infra-dev/modern.js/discussions/4511)。

### 一些示例

```js
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // 此时打包的类型文件输出路径为 `./dist/types`，并且将会读取项目下的 other-tsconfig.json 文件
  buildConfig: {
    buildType: 'bundle',
    dts: {
      tsconfigPath: './other-tsconfig.json',
      distPath: './types',
    },
    outDir: './dist',
  },
});
```

```js
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // 此时类型文件没有进行打包，输出路径为 `./dist/types`
  buildConfig: [
    {
      buildType: 'bundle',
      dts: false,
      outDir: './dist',
    },
    {
      buildType: 'bundleless',
      dts: {
        only: true,
      },
      outDir: './dist/types',
    },
  ],
});
```

## 构建过程

当执行 `modern build` 命令的时候，会发生

- 根据 `buildConfig.outDir` 清理产物目录。
- 编译 `js/ts` 源代码生成 bundle / bundleless 的 JS 构建产物。
- 使用 `tsc` 生成 bundle / bundleless 的类型文件。
- 处理 `copy` 任务。

## 构建报错

当发生构建报错的时候，基于以上了解到的信息，可以很容易的明白在终端出现的报错内容：

**js 或者 ts 构建的报错：**

```bash
error  ModuleBuildError:

╭───────────────────────╮
│ bundle failed:        │
│  - format is "cjs"    │
│  - target is "esnext" │
╰───────────────────────╯

Detailed Information:
```

**类型文件生成过程的报错：**

```bash
error   ModuleBuildError:

bundle DTS failed:
```

对于 `js/ts` 构建错误，我们可以从报错信息中知道：

- 报错的 `buildType`
- 报错的 `format`
- 报错的 `target`
- 其他具体报错信息
