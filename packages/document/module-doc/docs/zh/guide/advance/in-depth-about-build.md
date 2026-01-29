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
bundleless 是单文件编译模式，因此对于类型的引用和导出你需要加上 `type` 字段， 例如 `import type { A } from './types`，背景参考 [esbuild 文档](https://esbuild.github.io/content-types/#isolated-modules)。
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

在部分场景下，esbuild 不足以满足我们的需求，此时我们会使用 swc 来做代码转换。

从 **MAJOR_VERSION.36.0** 版本开始，涉及到以下功能时，Modern.js Module 默认会使用 swc ，但不这意味着不使用 esbuild 了，其余功能还是使用 esbuild:

- [transformImport](/api/config/build-config#transformimport)
- [transformLodash](/api/config/build-config#transformlodash)
- [externalHelpers](/api/config/build-config#externalhelpers)
- [format: umd](api/config/build-config#format-umd)
- [target: es5](api/config/build-config#target)
- [emitDecoratorMetadata: true](https://www.typescriptlang.org/tsconfig#emitDecoratorMetadata)

事实上，我们在 **MAJOR_VERSION.16.0** 版本开始全量使用 swc 进行代码转换。不过 swc 同样也存在一些限制，为此我们添加了 [sourceType](/api/config/build-config#sourcetype) 配置，当源码格式为 'commonjs' 时关闭 swc， 但这种方式并不符合用户直觉，另外，swc 格式化输出的 cjs 模式没有给每个导出名称添加注释，这在 node 中使用可能会带来一些问题。
因为我们废弃了此行为，回到了最初的设计 - **只在需要的场景下使用 swc 作为补充**。

## 使用 Hook 介入构建流程

Modern.js Module 提供了 Hook 机制，允许我们在构建流程的不同阶段注入自定义逻辑。
Modern.js Module Hook 使用了 [tapable](https://github.com/webpack/tapable) 实现，扩展了 esbuild 的插件机制，若 esbuild plugins 已经满足了你的需求,建议直接使用它。
下面展开说明其用法:

### Hook 类型

#### AsyncSeriesBailHook

串行执行的 hooks，如果某个 tapped function 返回非 undefined 结果，则后续其他的 tapped function 停止执行。

#### AsyncSeriesWaterFallHooks

串行执行的 hooks，其结果会传递给下一个 tapped function

### Hook 顺序

Hook 的执行顺序和注册顺序保持一致，可以通过 `applyAfterBuiltIn` 来控制在 BuiltIn Hook 前或后注册。

### Hook API

#### load

- AsyncSeriesBailHook
- 在 esbuild [onLoad callbacks](https://esbuild.github.io/plugins/#on-load) 触发，根据模块路径来获取模块内容
- 输入参数

```ts
interface LoadArgs {
  path: string;
  namespace: string;
  suffix: string;
}
```

- 返回参数

```ts
type LoadResult =
  | {
      contents: string; // 模块内容
      map?: SourceMap; // https://esbuild.github.io/api/#sourcemap
      loader?: Loader; // https://esbuild.github.io/api/#loader
      resolveDir?: string;
    }
  | undefined;
```

- 例子

```ts
compiler.hooks.load.tapPromise('load content from memfs', async args => {
  const contents = memfs.readFileSync(args.path);
  return {
    contents: contents,
    loader: 'js',
  };
});
```

#### transform

- AsyncSeriesWaterFallHooks
- 在 esbuild [onLoad callbacks](https://esbuild.github.io/plugins/#on-load) 触发，
  将 load 阶段获取的模块内容进行转换
- 输入参数(返回参数)

```ts
export type Source = {
  code: string;
  map?: SourceMap;
  path: string;
  loader?: string;
};
```

- 例子

```ts
compiler.hooks.transform.tapPromise('6to5', async args => {
  const result = babelTransform(args.code, { presets: ['@babel/preset-env'] });
  return {
    code: result.code,
    map: result.map,
  };
});
```

#### renderChunk

- AsyncSeriesWaterFallHooks
- 在 esbuild [onEnd callbacks](https://esbuild.github.io/plugins/#on-end) 触发，
  类似于 transform hook，但是作用在 esbuild 生成的产物
- 输入参数(返回参数)

```ts
export type AssetChunk = {
  type: 'asset';
  contents: string | Buffer;
  entryPoint?: string;
  /**
   * absolute file path
   */
  fileName: string;
  originalFileName?: string;
};

export type JsChunk = {
  type: 'chunk';
  contents: string;
  entryPoint?: string;
  /**
   * absolute file path
   */
  fileName: string;
  map?: SourceMap;
  modules?: Record<string, any>;
  originalFileName?: string;
};

export type Chunk = AssetChunk | JsChunk;
```

- 例子

```ts
compiler.hooks.renderChunk.tapPromise('minify', async chunk => {
  if (chunk.type === 'chunk') {
    const code = chunk.contents.toString();
    const result = await minify.call(compiler, code);
    return {
      ...chunk,
      contents: result.code,
      map: result.map,
    };
  }
  return chunk;
});
```

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

- 对类型文件进行打包不会开启类型检查。
- 一些第三方依赖存在错误的语法会导致打包过程失败。因此对于这种情况，需要手动通过 [`buildConfig.externals`](/api/config/build-config#externals) 将这类第三方包排除，或者直接关闭[dts.respectExternal](/api/config/build-config#dtsrespectexternal)从而不打包任何三方包类型。
- 对于第三方依赖的类型文件指向的是一个 `.ts` 文件的情况，目前无法处理。比如第三方依赖的 `package.json` 中存在这样的内容： `{"types": "./src/index.ts"`。

对于上述问题，我们推荐的处理方式是首先使用 `tsc` 生成 d.ts 文件，然后将 index.d.ts 作为入口进行打包处理，并且关闭 `dts.respectExternal`。在之后的演进我们也会逐渐向这种处理方式靠拢。

### 别名转换

在 bundleless 构建过程中，如果源代码中出现了别名，例如：

```js title="./src/index.ts"
import utils from '@common/utils';
```

使用 `tsc` 生成的产物类型文件也会包含这些别名。不过 Modern.js Module 会对 `tsc` 生成的类型文件里的别名进行转换处理。

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
- 处理 `copy` 任务。
- 编译 `js/ts` 源代码生成 bundle / bundleless 的 JS 构建产物。
- 使用 `tsc` 生成 bundle / bundleless 的类型文件。

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

## 调试模式

从 **MAJOR_VERSION.36.0** 版本开始，为了便于排查问题，Modern.js Module 提供了调试模式，你可以在执行构建时添加 DEBUG=module 环境变量来开启调试模式。

```bash
DEBUG=module modern build
```

调试模式下，你会看到 Shell 中输出更详细的构建日志，这主要以流程日志为主：

```bash
module run beforeBuildTask hooks +6ms
module run beforeBuildTask hooks done +0ms
module [DTS] Build Start +139ms
module [CJS] Build Start +1ms
```

另外，Module 还提供了调试内部工作流程的能力。你可以通过设置环境变量 `DEBUG=module:*` 来开启更详细的调试日志:

目前只支持了 `DEBUG=module:resolve`，可以查看 Module 内部模块解析的详细日志:

```bash
  module:resolve onResolve args: {
  path: './src/hooks/misc.ts',
  importer: '',
  namespace: 'file',
  resolveDir: '/Users/bytedance/modern.js/packages/solutions/module-tools',
  kind: 'entry-point',
  pluginData: undefined
} +0ms
  module:resolve onResolve result: {
  path: '/Users/bytedance/modern.js/packages/solutions/module-tools/src/hooks/misc.ts',
  external: false,
  namespace: 'file',
  sideEffects: undefined,
  suffix: ''
} +0ms
```
