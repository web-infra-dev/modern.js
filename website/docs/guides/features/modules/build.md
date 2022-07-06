---
sidebar_position: 3.5
---

# 如何构建模块

本章讲解在可复用模块项目中编译构建的相关内容，相关 API 详见：

* [`output.buildConfig`](/docs/apis/config/output/build-config)
* [`output.buildPreset`](/docs/apis/config/output/build-preset)

## 构建支持

首先简单介绍一下模块工程方案的构建支持。

### 模块类型支持

模块工程方案支持了丰富的模块类型，常见的模块包括
- ECMAScript Module
- CommonJS Module
- 资源模块

通过插件系统可以自由的扩展模块，可以将所有的文件以模块的形式集成进来。通过插件的方式，已经内置支持了更多的模块类型，其中包括：

- [TypeScript](https://www.typescriptlang.org/)
- [Sass](https://sass.bootcss.com/)
- [Less](https://lesscss.org)

### 产物格式支持
模块工程方案支持目前主流的模块系统 —— ESM (ECMA Script Module) 和 CJS (CommonJS)。同时还支持 UMD（Universal Module Definition）。

### 目标环境支持

模块工程方案默认支持所有最新的 JS 特性，即 `esnext`。同时也可以通过 [`buildConfig.target`](/docs/apis/config/output/build-config/target) 设置以支持其他目标环境。

### 类型文件支持

模块工程方案里内置了对于 TypeScript 的支持，同时支持生成类型声明文件。你可以通过 [`buildConfig.enableDts`](/docs/apis/config/output/build-config/enable-dts) 和 [`buildConfig.dtsOnly`](/docs/apis/config/output/build-config/dts-only) 控制类型声明文件如何生成。

接下来具体学习一下如何使用模块工程提供的这些功能。

## 使用构建预设

当面对不同的通用构建场景（需求）的时候，可以通过使用 [`output.buildPreset`](/docs/apis/config/output/build-preset) 设置项目的构建配置。

[`output.buildPreset`](/docs/apis/config/output/build-preset) 是模块工程方案提供的构建预设配置。支持的预设值所对应的构建产物结果，是从社区里众多 NPM 包的产物结果中总结出来的，可以满足大部分场景下的构建需要。关于更多可用的预设值，可以查看 `output.buildPreset` 的[文档](/docs/apis/config/output/build-preset)。

> 模块工程方案提供的预设值也会不断的修改和新增。欢迎通过提 [Issue](https://github.com/modern-js-dev/modern.js/issues/new?assignees=&labels=rfc&template=4-feature-request.zh-Hans.yml&title=%5BRFC%5D%3A+) 的形式，一起来补充和完善更多常用的构建场景预设。

## 使用自定义通用配置

当 `output.buildPreset` 配置无法满足构建需求的时候，推荐使用 [`output.buildConfig`](/docs/apis/config/output/build-config) 进行自定义配置。[`output.buildConfig`](/docs/apis/config/output/build-config) 是 Module Tools 构建功能的底层配置，`output.buildPreset` 也是基于 [`output.buildConfig`](/docs/apis/config/output/build-config) 实现的。

下面讲解一下关于 [`output.buildConfig`](/docs/apis/config/output/build-config) 的配置以及如何使用。首先需要认识一下【[构建类型](#构建类型)】。

### 构建类型

在模块工程方案里，支持 Bundle 和 Bundleless 两种形式来构建你的模块。

> 所谓 Bundle 构建是指将构建产物进行打包，但是未必一定打包成一个文件；而 Bundleless 构建指不对构建产物进行打包，每个构建产物文件都可以找到对应的源文件。

在开始执行构建之前，首先考虑**项目的构建产物是否需要打包**？针对打包或者不打包的情况，你需要对 [`buildConfig.buildType`](/docs/apis/config/output/build-config/build-type) 分别配置 `bundle` 或者 `bundleless`。

```js title="支持 bundle 构建的 modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
    },
  },
});
```

```js title="支持 bundleless 构建的 modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundleless',
    },
  },
});
```

如果项目包含多套构建产物，那么可以配置 [`output.buildConfig`](/docs/apis/config/output/build-config) 为一个数组。**[`output.buildConfig`](/docs/apis/config/output/build-config) 不仅支持对象形式，同时也支持数组形式，可以同时输出多种构建产物**。

> “多套构建产物”是指支持不同的语法、模块化格式等条件的构建产物。

```js title="支持多种构建配置的 modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
      },
      {
        buildType: 'bundleless',
      },
    ],
  },
});
```

当确定好构建类型后，接下来就要考虑以下几件事：

* 构建产物的模块化格式是什么？
* 构建产物支持 ECMAScript 的最高版本是多少？
* 是否需要 `d.ts` 文件?
* 是否需要 `sourceMap`以及 `sourceMap` 的使用形式？
* 产物输出到哪里？

接下来就讲一下如何通过 [`output.buildConfig`](/docs/apis/config/output/build-config) 进行这些配置。

### 选择模块化格式

模块工程方案在 Bundle 场景下支持 `cjs`、`esm`、`umd` 的产物格式以及在 Bundleless 场景下支持 `cjs` 和 `esm` 的产物格式。

当配置产物的模块化格式的时候，可以通过 [`buildConfig.format`](/docs/apis/config/output/build-config/format) 进行配置。

例如当配置 Bundle 产物为 `umd` 格式的时候，可以按照如下进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        format: 'umd',
      },
    ],
  },
});
```

基于上面的配置，增加构建 `esm` 格式的 Bundleless 构建产物的时候，配置如下：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        format: 'umd',
      },
      {
        buildType: 'bundleless',
        format: 'esm',
      },
    ],
  },
});
```

### 确定支持的 ECMAScript 最高版本

配置构建产物支持的 ECMAScript 最高版本，或者说支持的目标环境，可以通过 [`buildConfig.target`](/docs/apis/config/output/build-config/target) 进行配置。

> ECMAScript 是一种由 Ecma 国际（前身为欧洲计算机制造商协会）在标准 ECMA-262 中定义的脚本语言规范。这种语言在万维网上应用广泛，它往往被称为 JavaScript 或 JScript，但实际上后两者是 ECMA-262 标准的实现和扩展。

当前模块工程方案支持以下 ECMAScript 版本：

* `es5`
* `es6`
* `es2015`
* `es2016`
* `es2017`
* `es2018`
* `es2019`
* `es2020`
* `esnext`

可以按照如下方式进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        format: 'umd',
        target: 'es5',
      },
      {
        buildType: 'bundleless',
        format: 'esm',
        target: 'es6',
      },
    ],
  },
});
```

:::caution 注意
当前在 Bundleless 构建的情况下 `buildConfig.target` 仅支持 `es5` 和 `es6`，后续会增加其他版本的支持。
:::

### 生成 `.d.ts` 文件

当项目是一个 TypeScript 项目的时候，可以选择构建产物是否包含 `d.ts` 类型文件。通过 [`buildConfig.enableDts`](/docs/apis/config/output/build-config/enable-dts) 配置选择是否开启 `d.ts` 文件生成以及类型检查。

默认情况下，该配置为 `false`，即不生成 `d.ts` 文件，也不做类型检查。可以通过如下配置开启该功能：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        format: 'esm',
        target: 'es6',
        enableDts: true,
      },
    ],
  },
});
```

此时生成的 `d.ts` 文件会与其他产物在同一个目录下。

```
├── dist
│   ├── index.d.ts
│   └── index.js
```

当需要将 `d.ts` 文件输出到指定路径的时候，可以为 `d.ts` 文件的生成单独提供一份构建配置，**同时需要开启 [`buildConfig.dtsOnly`](/docs/apis/config/output/build-config/dts-only) 配置**。比如下面的配置表示仅生成 `d.ts` 文件并输出到 `./dist/types` 目录下：

> 构建产物的根目录由 [`output.path`](/docs/apis/config/output/path) 决定，默认为 `./dist`。

> 关于 [`buildConfig.outputPath`](/docs/apis/config/output/build-config/output-path) 的使用，可参考 【[产物的输出位置](#产物的输出位置)】。

```
├── dist
│   ├── types
│   │   └── index.d.ts
│   └── index.js
```

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        enableDts: true,
        dtsOnly: true,
        outputPath: './types',
      },
      {
        buildType: 'bundleless',
        format: 'esm',
        target: 'es6',
      },
    ],
  },
});
```


[`buildConfig.dtsOnly`](/docs/apis/config/output/build-config/dts-only) 配置常用在这个场景下。**在非 TypeScript 项目下**，该配置以及 [`buildConfig.enableDts`](/docs/apis/config/output/build-config/enable-dts) 都不再生效。


除了上述讲到的内容以外，**`.d.ts` 文件还支持 Bundle 和 Bundleless 两种生成模式**。Bundleless 模式的 `d.ts` 文件生成与 TypeScript 一样，每个 `d.ts` 文件与源码文件一一对应；而 Bundle 模式的 `d.ts` 文件生成则会将所有类型文件进行打包处理，最终输出一个 `d.ts` 类型文件。

```js title="Bundle 模式 d.ts 文件生成对应的 modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        enableDts: true,
        dtsOnly: true,
        outputPath: './types',
      },
    ],
  },
});
```

```js title="Bundleless 模式 d.ts 文件生成对应的 modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        enableDts: true,
        dtsOnly: true,
        outputPath: './types',
      },
    ],
  },
});
```

最后，还可以指定生成 `d.ts` 类型文件所需要的 TSConfig 文件。**通过 [`buildConfig.tsconfig`](/docs/apis/config/output/build-config/tsconfig) 配置可以指定自定义的 TSConfig 文件名称**。

```js title="使用 buildConfig.tsconfig 的 modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        enableDts: true,
        dtsOnly: true,
        outputPath: './types',
        tsconfig: './tsconfig.build.json',
      },
    ],
  },
});
```


### 处理 sourceMap

默认情况下，模块工程方案在 Bundle 构建的产物中提供 SourceMap 文件，而在 Bundleless 构建的产物中不会提供。

如果需要进行自定义配置，则可以配置 [`buildConfig.sourceMap`](/docs/apis/config/output/build-config/source-map)。

```js title="使用 buildConfig.tsconfig 的 modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        sourceMap: true,
      },
    ],
  },
});
```

### 产物的输出位置

当存在多个构建配置的时候，往往可能需要考虑为每个构建配置提供对应的产物输出路径。

模块工程方案提供了 [`buildConfig.outputPath`](/docs/apis/config/output/build-config/output-path) 进行配置。

例如当产物的根目录为 `./lib`，将 `esm` 产物输出到 `./lib/esm` 目录下，将 `cjs`产物输出到 `./lib/cjs` 目录下，则可以按照以下方式进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    path: './lib',
    buildConfig: [
      {
        format: 'esm',
        outputPath: './esm',
      },
      {
        format: 'cjs',
        outputPath: './cjs',
      },
    ],
  },
});
```

以上所有的配置都是 Bundle 和 Bundleless 构建的通用配置，可以满足大部分需求。不过 Bundle 和 Bundleless 构建之间也有一些差异，对于这些差异就需要通过不同的 API 进行区分。模块工程方案针对于这种情况提供了 [`buildConfig.bundleOptions`](/docs/apis/config/output/build-config/bundle-options) 和 [`buildConfig.bundlelessOptions`](/docs/apis/config/output/build-config/bundleless-options) API 分别对 Bundle 和 Bundleless 构建进行自定义配置。

## 使用自定义 Bundle(less) 配置

### Bundle 构建

对于 Bundle 这种场景，模块工程方案使用 Speedy 作为 Bundler。对于 Speedy，你可以理解为它是一个 Universal Bundler。它使用 [Tapable](https://github.com/webpack/tapable) 扩展了 [esbuild](https://github.com/evanw/esbuild) 的插件系统，带来了极致的编译速度和友好的插件系统，可以满足 Bundle 的构建需求。

当使用 Bundle 构建的时候，一般情况下，你无需任何 Bundle 相关的配置，只需要将 [`buildConfig.buildType`](/docs/apis/config/output/build-config/build-type) 设置为 `'bundle'` 即可。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
      },
    ],
  },
});
```

这里之所以不需要任何配置，是因为 **Bundler 会默认从入口 `src/index.(j|t)s` 开始**，收集模块的依赖，生成一份模块依赖图，再将其转换成一份 Chunk 图并把文件写入磁盘中。

Bundle 相比于 Bundleless 场景，是需要提供构建的入口（文件）。当 Bundle 构建的入口文件不是 `src/index.(j|t)s` 的时候，就需要通过手动配置 [`bundleOptions.entry`](/docs/apis/config/output/build-config/bundle-options#entry) 来修改。

例如打包一个组件项目，入口文件为 `src/index.tsx`，则可以按照如下方式进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        bundleOptions: {
          entry: {
            'index': './src/index.tsx',
          },
        },
      },
    ],
  },
});
```

默认情况下，Bundle 构建只会将源码文件打包成一个 Chunk。这是因为模块工程方案提供的 [`bundleOptions.skipDeps`](/docs/apis/config/output/build-config/Bundle-options#skipDeps) 默认值为 `true`。[`bundleOptions.skipDeps`](/docs/apis/config/output/build-config/Bundle-options#skipDeps) 用于**跳过项目里 `package.json` 上所有的依赖打包进产物中**。如果不希望使用默认配置，则可以通过下面的方式关闭：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        bundleOptions: {
          entry: {
            'index': './src/index.tsx',
          },
          skipDeps: false,
        },
      },
    ],
  },
});
```

[`bundleOptions.skipDeps`](/docs/apis/config/output/build-config/Bundle-options#skipDeps) 功能是基于 [`bundleOptions.externals`](/docs/apis/config/output/build-config/Bundle-options#externals) 实现的。当项目需要自定义外置某些依赖的时候，例如外置 React 依赖，可以按照如下方式进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        bundleOptions: {
          entry: {
            'index': './src/index.tsx',
          },
          skipDeps: false, // 必须要配置
          externals: ['React'],
        },
      },
    ],
  },
});
```

除了 [`bundleOptions.skipDeps`](/docs/apis/config/output/build-config/Bundle-options#skipDeps) 和 [`bundleOptions.externals`](/docs/apis/config/output/build-config/Bundle-options#externals) 这两个配置用于控制如何打包外部的依赖模块，模块工程方案还提供了 [`bundleOptions.platform`](/docs/apis/config/output/build-config/Bundle-options#platform) 用于设置构建环境。

除了上述这些功能，Bundler 也提供了**代码分割**和**代码压缩**这样的优化功能。默认情况下，它们是关闭的。你可以通过阅读它们的 API 文档了解如何使用。

* [`bundleOptions.splitting`](/docs/apis/config/output/build-config/Bundle-options#splitting)
* [`bundleOptions.minify`](/docs/apis/config/output/build-config/Bundle-options#minify)

### Bundleless 构建

对于 Bundleless 这种场景，模块工程方案使用 [Babel](https://babeljs.io/) 作为 Bundleless 的 JavaScript 和 TypeScript 编译工具。

当使用 Bundleless 构建的时候，一般情况下，无需任何 Bundleless 相关的配置，只需要将 [`buildConfig.buildType`](/docs/apis/config/output/build-config/build-type) 设置为 `'bundleless'` 即可。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
      },
    ],
  },
});
```

这里之所以不需要任何配置，是因为模块工程方案对于 Bundleless 构建会默认将项目的 `src/` 目录作为源码目录，对这个目录下的所有文件进行编译。

当需要修改源码目录的时候，可以通过手动配置 [`bundlelessOptions.sourceDir`](/docs/apis/config/output/build-config/bundleless-options#sourcedir) 来实现。例如指定 `lib/` 目录为源码目录，可以按照如下方式进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './lib',
        }
      },
    ],
  },
});
```

模块工程方案针对样式的编译处理，提供了基于 [Less](https://lesscss.org/)、[Sass](https://sass-lang.com/)、[PostCSS](https://postcss.org/) 实现的样式“编译器”。同时提供了 [`bundlelessOptions.style.compileMode`](/docs/apis/config/output/build-config/bundleless-options#compilemode) API 来决定使用样式“编译器”的方式，下面详细讲解如何使用这个配置。

对于包含了样式文件的 Bundleless 构建，默认情况下，产物中会包含**编译后的样式文件（CSS 文件）以及样式源码文件**。因为此时 [`bundlelessOptions.style.compileMode`](/docs/apis/config/output/build-config/bundleless-options#compilemode) 的默认值为 `'all'`，即编译样式源码成为产物的同时也会复制一份样式源码到产物中。

当希望项目中**仅包含样式编译后的产物**的时候，则可以通过以下方式进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          style: {
            compileMode: 'only-compiled-code',
          },
        },
      },
    ],
  },
});
```

而如果希望项目里的样式文件交给其他地方来处理，即**产物中仅保留样式源码**，则可以通过以下方式进行配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          style: {
            compileMode: 'only-source-code',
          },
        },
      },
    ],
  },
});
```

最后对于一些特殊情况，希望**不开启对样式的任何编译和处理**，则可以通过以下方式关闭：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          style: {
            compileMode: false,
          },
        },
      },
    ],
  },
});
```

当确定如何处理样式文件后，模块工程方案还为样式产物提供了自定义指定输出位置的配置，可以通过  [`bundlelessOptions.style.path`](/docs/apis/config/output/build-config/bundleless-options#path) 来是实现：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          style: {
            compileMode: false,
            path: './styles',
          },
        },
      },
    ],
  },
});
```

上面的例子表示：将样式的产物输出到 `/dist/styles` 目录下面。

:::tip 关于上面例子的详解

默认情况下，[`output.path`](/docs/apis/config/output/path) 为 `/dist`，[`buildConfig.outputPath`](/docs/apis/config/output/build-config/output-path) 为 `./`，[`bundlelessOptions.style.path`](/docs/apis/config/output/build-config/bundleless-options#path) 为 `./styles`。因此最终样式产物输出的路径为 `./dist/styles`。
:::

同样的，模块工程方案对 Bundleless 构建的静态文件输出目录也提供了类似的 API，可以通过 [`bundlelessOptions.static.path`](/docs/apis/config/output/build-config/bundleless-options#path-1) 进行配置，例如将所有的静态文件输出到 `dist/static/` 目录下：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          static: {
            path: './static',
          },
        },
      },
    ],
  },
});
```

对于 [`bundlelessOptions.style.path`](/docs/apis/config/output/build-config/bundleless-options#path) 和 [`bundlelessOptions.static.path`](/docs/apis/config/output/build-config/bundleless-options#path-1)，当对它们进行配置的时候，也会**影响 Babel 编译的代码中对使用到的样式文件路径和静态资源文件路径的处理**。模块工程方案内部提供了支持这两个 API 的 Babel 插件。

## 修改编译工具配置

当【[构建预设](#使用构建预设)】、【[自定义通用配置](#使用自定义通用配置)】、【[自定义 Bundle(less) 配置](#使用自定义-bundleless-配置)】不能满足需求，并且希望修改关于 Babel 或者 Speedy 配置的时候，可以通过以下 API 进行配置：

* [`tools.babel`](/docs/apis/config/tools/babel)
