---
sidebar_position: 3
---

# 修改输出产物

## 默认输出产物

当你在初始化的项目里使用 `modern build` 命令的时候，Modern.js Module 会根据当前配置内容，生成相应的构建产物。

模板创建的默认配置内容如下：

```ts title="modern.config.ts"
import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // 注册 Modern.js Module 的 CLI 工具
  plugins: [moduleTools()],
  // 指定构建预设配置
  buildPreset: 'npm-library',
});
```

**默认生成产物具有以下特点**：

- 会生成 [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules) 和 [ESM](https://nodejs.org/api/esm.html#modules-ecmascript-modules) 两份产物。
- 代码语法支持到 `ES6` ,更高级的语法将会被转换。
- 所有的代码经过打包变成了一个文件，即进行了 **bundle** 处理。
- 产物输出根目录为项目下的 `dist` 目录，类型文件输出的目录为 `dist/types`。

看到这里你可能会有以下疑问：

1. `buildPreset` 是什么？
2. 产物的这些特点是由什么决定的？

接下来，我们首先来了解一下 `buildPreset`。

## 构建预设

`buildPreset` 代表着提前准备好的一组或者多组构建相关的配置，只需要使用 `buildPreset` 对应的预设值，就可以省去麻烦且复杂的配置工作，得到符合预期的产物。

Modern.js Module 主要内置了两套构建预设，包括:

- `npm-component`: 用于构建组件库。
- `npm-library`: 用于打包其他库类型的项目，如工具库。

同时，还提供一些变体，例如 `npm-library-with-umd` 和 `npm-library-es5`，顾名思义，分别对应带有 umd 产物和支持到 es5 语法的库预设。
详细配置可以查看其 [API](/api/config/build-preset) 。

除此之外，我们也可以完全自定义构建配置:

## 构建配置

**`buildConfig` 是一个用来描述如何编译、生成构建产物的配置项**。在最开始提到的关于“_构建产物的特点_”，其实都是 `buildConfig` 所支持的属性。目前所支持的属性覆盖了大部分模块类型项目在构建产物时的需求，`buildConfig` 不仅包含一些产物所具备的属性，也包含了构建产物所需要的一些特性功能。接下来从分类的角度简单罗列一下：

**构建产物的基本属性包括：**

- 产物是否被打包：对应的 API 是 [`buildConfig.buildType`](/api/config/build-config#buildtype)。
- 产物对于语法的支持：对应的 API 是 [`buildConfig.target`](/api/config/build-config#target)。
- 产物格式：对应的 API 是 [`buildConfig.format`](/api/config/build-config#format)。
- 产物类型文件如何处理，对应的 API 是 [`buildConfig.dts`](/api/config/build-config#dts)。
- 产物的 sourceMap 如何处理：对应的 API 是 [`buildConfig.sourceMap`](/api/config/build-config#sourcemap)。
- 产物对应的输入（或者是源文件）：对应的 API 是 [`buildConfig.input`](/api/config/build-config#input)。
- 产物输出的目录：对应的 API 是 [`buildConfig.outDir`](/api/config/build-config#outdir)。
- 构建的源码目录：对应的 API 是 [`buildConfig.sourceDir`](/api/config/build-config#sourcedir)。

**构建产物所需的常用功能包括：**

- 别名：对应的 API 是 [`buildConfig.alias`](/api/config/build-config#alias)。
- 静态资源处理：对应的 API 是 [`buildConfig.asset`](/api/config/build-config#asset)。
- 第三方依赖处理：对应的 API 有：
  - [`buildConfig.autoExternal`](/api/config/build-config#autoexternal)。
  - [`buildConfig.externals`](/api/config/build-config#externals)。
- 拷贝：对应的 API 是 [`buildConfig.copy`](/api/config/build-config#copy)。
- 全局变量替换：对应的 API 是 [`buildConfig.define`](/api/config/build-config#define)。
- 指定 [JSX](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) 编译方式，对应的 API 是 [`buildConfig.jsx`](/api/config/build-config#jsx)。

**一些高级属性或者使用频率不高的功能：**

- 产物代码压缩：对应的 API 是 [`buildConfig.minify`](/api/config/build-config#minify)。
- 代码分割：[`buildConfig.spitting`](/api/config/build-config#splitting)
- 指定构建产物用于 NodeJS 环境还是浏览器环境：对应的 API 是 [`buildConfig.platform`](/api/config/build-config#platform)。
- umd 产物相关：
  - 指定 umd 产物外部导入的全局变量：对应的 API 是 [`buildConfig.umdGlobals`](/api/config/build-config#umdglobals)。
  - 指定 umd 产物的模块名：对应的 API 是 [`buildConfig.umdModuleName`](/api/config/build-config#umdmodulename)。

除了以上分类以外，关于这些 API 的常见问题和最佳实践可以通过下面的链接来了解：

- [关于 `bundle` 和 `bundleless`](/guide/advance/in-depth-about-build#bundle--bundleless)
- [关于 `input` 和 `sourceDir`](/guide/advance/in-depth-about-build#input--sourcedir)。
- [关于类型描述文件](/guide/advance/in-depth-about-build#dts)。
- [如何使用 define](/guide/advance/in-depth-about-build#define)
- [如何处理第三方依赖](/guide/advance/external-dependency)
- [如何使用拷贝](/guide/advance/copy)
- [如何构建 umd 产物](/guide/advance/build-umd)
- [如何使用静态资源](/guide/advance/asset)

## 结合配置与预设

了解 `buildPreset` 和 `buildConfig` 之后，我们可以将二者进行结合使用。

在实际项目中,我们可以先使用 `buildPreset` 来快速获取一套默认构建配置。如果需要自定义,可以使用 `buildConfig` 进行覆盖和扩展。

扩展的逻辑如下:

- 当 `buildConfig` 是数组时，会在原来的预设基础上添加新的配置项。

```ts title="modern.config.ts"
import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
  buildConfig: [
    {
      format: 'iife',
      target: 'es2020',
      outDir: './dist/global'
    }
  ]
});
```

这会在原本预设的基础上，额外生成一份 IIFE 格式、支持到 ES2020 语法的产物，输出目录为项目下的 `dist/global` 目录。

- 当 `buildConfig` 是对象时,会将对象中的配置项覆盖到预设中。

```ts title="modern.config.ts"
import { moduleTools, defineConfig } from '@modern-js/module-tools';
export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
  buildConfig: {
    sourceMap: true,
  }
});
```

这会使得每一项构建任务都会生成 sourceMap 文件。
