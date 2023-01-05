---
sidebar_position: 3
---

# 修改输出产物

## 默认输出产物

当在初始化的项目里使用 `modern build` 命令的时候，会根据 Module Tools 默认支持的配置生成相应的产物。默认支持的配置具体如下：

```typescript
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildPreset: 'base-config',
});
```

**默认生成产物具有以下特点**：

- 代码格式为 [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules)，或者简称为 `cjs`。
- 代码语法支持到 `ES6`。
- 所有的代码经过打包变成了一个文件，即进行了 **bundle** 处理。
- 产物输出根目录为项目下的 `dist` 目录，类型文件输出的目录为 `dist/types`。

:::tip

1. 所谓“代码语法支持到 ES6”的意思是指：产物代码所支持的语法不会超过 `ES6`。如果源码中使用语法是 `ES6` 以上的语法（例如 `ES2017`），则会被进行转换。
   :::

看到这里你可能会有以下疑问：

1. `buildPreset` 是什么？
2. 产物的这些特点是由什么决定的？

那么接下来首先解释一下 `buildPreset`。

## 构建预设

`buildPreset` 代表着提前准备好的一组或者多组构建相关的配置，只需要使用 `buildPreset` 对应的预设值，就可以省去麻烦且复杂的配置工作，得到符合预期的产物。

### 构建预设的字符串形式

**构建预设的值可以是字符串形式**，因此这样形式的构建预设叫做预设字符串。

模块工程解决方案根据 npm 包使用的通用场景，提供了通用的构建预设字符串以及相应的变体。目前支持的所有预设字符串可以通过 [BuildPreset API](/api/config/build-config) 查看。这里讲解一下关于**通用的预设字符串与变体之间的关系**。

在通用的预设字符串中，`"npm-library"` 可以用于在开发库类型的 npm 包的场景下使用，它适合大多数普通的模块类型项目。当设置 `"npm-library"` 的时候，项目的输出产物会有以下特点：

- 在 `dist/lib` 目录下会得到代码格式为 `cjs`、语法支持到 `es6` 且经过打包处理后的产物。
- 在 `dist/es` 目录下会得到代码格式为 `esm`、语法支持为 `es6` 且经过打包处理后的产物。
- 在 `dist/types` 目录下会得到类型文件。如果不是 TypeScript 项目，则没有该目录。

而预设字符串 `"npm-library"` 对应的变体则是在原本产物的基础上修改了**代码语法支持**这一特点，同时在字符串命名上也变为了 `"npm-library-[es5 | es2016...es2020 | esnext]"` 这样的形式。

例如，如果在预设字符串 `"npm-library"` 对应的输出产物基础上，让产物代码支持的语法变为 `es2017` 的话，那么只需要将 `"npm-library"` 改变为 `"npm-library-es2017"` 就可以了。

### 构建预设的函数形式

**除了字符串形式以外，构建预设的值也可以是函数形式，在函数中可以打印或者修改某个预设值对应的具体配置**。

例如，如果使用预设函数的形式达到预设字符串 `"npm-library-es2017"` 同样的效果，可以按照如下的方式：

```typescript
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildPreset({ preset }) {
    return preset.NPM_LIBRARY.map(config => {
      return { ...config, target: 'es2017' };
    });
  },
});
```

在上面的代码实现中，`preset.NPM_LIBRARY` 与预设字符串 `"npm-library"` 是相对应的，它代表着 `"npm-library"` 等价的多组构建相关的配置。我们通过 `map` 方法遍历了 `NPM_LIBRARY` 这个数组，在这个数组中包含了多个 `buildConfig` 对象。我们将原本的 `buildConfig` 对象进行了浅拷贝并修改了浅拷贝后得到 `buildConfig.target`，将它指定为 `es2017`。

> 关于 `preset.NPM_LIBRARY` 具体对应的值，可以通过 [BuildPreset API](/api/config/build-config) 查看。在 `preset` 对象下不仅包含了 `NPM_LIBRARY`，还包含了其他类似的常量。

那么这里的 `buildConfig` 对象是什么呢？之前提到的构建产物特点又是根据什么呢？

接下来我们解释一下。

## 构建配置（对象）

**`buildConfig` 是一个用来描述如何编译、生成构建产物的配置对象**。在最开始提到的关于“_构建产物的特点_”，其实都是 `buildConfig` 所支持的属性。目前所支持的属性覆盖了大部分模块类型项目在构建产物时的需求，`buildConfig` 不仅包含一些产物所具备的属性，也包含了构建产物所需要的一些特性功能。接下来从分类的角度简单罗列一下：

**构建产物的基本属性包括：**

- 产物是否被打包：对应的 API 是 [`buildConfig.buildType`](/api/config/build-config#buildtype)。
- 产物对于语法的支持：对应的 API 是 [`buildConfig.target`](/api/config/build-config#target)。
- 产物格式：对应的 API 是 [`buildConfig.format`](/api/config/build-config#format)。
- 产物类型文件如何处理，对应的 API 是 [`buildConfig.dts`](/api/config/build-config#dts)。
- 产物的 sourceMap 如何处理：对应的 API 是 [`buildConfig.sourceMap`](/api/config/build-config#sourcemap)。
- 产物对应的输入（或者是源文件）：对应的 API 是 [`buildConfig.input`](/api/config/build-config#input)。
- 产物输出的目录：对应的 API 是 [`buildConfig.outDir`](/api/config/build-config#outDir)。
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

除了以上分类以外，关于这些 API 的常见问题和最佳实践可以通过下面的链接来了解，敬请期待。

- [什么是 `bundle` 和 `bundleless`?](/guide/advance/in-depth-about-build#bundle-和-bundleless)
- [`input` 与 `sourceDir` 的关系](/guide/advance/in-depth-about-build#input-与-sourcedir-的关系)。
- [产物中类型文件的多种生成方式](/guide/advance/in-depth-about-build#类型文件)。
- [`buildConfig.define` 不同场景的使用方式。](/guide/advance/in-depth-about-build#buildconfigdefine-不同场景的使用方式)
- [如何处理第三方依赖？](/guide/advance/external-dependency)
- [如何使用拷贝？](/guide/advance/copy)
- [如何构建 umd 产物？](/guide/advance/build-umd#设置项目的全局变量名称)
- [静态资源目前所支持的能力。](/guide/advance/asset)

## 什么时候使用 `buildConfig`

`buildConfig` 是用于修改产物的方式之一，**当与 `buildPreset` 配置同时存在的时候，只有 `buildConfig` 才会生效**。因此如果按照如下方式配置：

```typescript
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: [{}],
  buildPreset: 'base-config',
});
```

那么此时就会看到如下提示：

```bash
因为同时出现 'buildConfig' 和 'buildPreset' 配置，因此仅 'buildConfig' 配置生效
```

`buildPreset` 代表的一组或者多组构建相关的配置都是由 `buildConfig` 组成，**当使用 `buildPreset` 无法满足当前项目需求的时候，就可以使用 `buildConfig` 来自定义输出产物**。

在使用 `buildConfig` 的过程，就是对“_获得怎样的构建产物_”的思考过程。
