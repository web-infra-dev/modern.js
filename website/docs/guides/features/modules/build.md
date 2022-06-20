---
sidebar_position: 6
---

# 构建可复用模块
> 本章讲解在可复用模块项目中编译构建的相关内容，配置详见[buildConfig](/docs/apis/config/output/build-config/build-type)

随着前端工程越来越复杂，可复用则显现得尤为重要，各种npm包层出不穷。我们通过模块化实现可复用，如搭积木般编程，即将一个 JavaScript 程序拆分为可按需导入的单独模块，每个模块都可以独自的验证、调试以及测试，并提供了良好的封装和抽象，供其他开发者使用。


## 开箱即用
你可以直接在模块工程目录下执行以下命令
```
pnpm run build
```
构建你的项目无需任何配置，同时提供多种[buildPreset](/docs/apis/config/output/build-preset)，这些预设是从社区的npm包的产物目录中提取出来的，可以满足大部分场景下的构建需要，真正实现零配置

## 构建类型
在模块工程方案里，我们支持`bundle`和`bundleless`两种形式来构建你的模块。

### bundle
对于bundle这种场景，我们采取[speedy](https://github.com/speedy-js/speedystack)作为bundler，speedy可以定义为一个universal bundler，它使用[tapable](https://github.com/webpack/tapable)扩展了[esbuild](https://github.com/evanw/esbuild)的插件系统，带来了极致的编译速度和友好的插件系统，你可以通过[tools.speedy](/docs/apis/config/tools/speedy)来设定任何speedy可接受的配置

bundle情况下只需要指定一个入口，无任何文件约定，bundler会从入口开始，收集模块的依赖，生成一份模块依赖图，再转换成一份chunk图并写入磁盘中。
构建过程中
- 默认会打包所有第三方依赖，可以通过[externals](/docs/apis/config/output/build-config/bundle-options#externals)外置化第三方依赖
- 默认会external node模块，详见[platform](/docs/apis/config/output/build-config/bundle-options#platform)
- 默认关闭代码分割，可以通过开启[splitting](/docs/apis/config/output/build-config/bundle-options#splitting)将代码分割成独立的chunk，支持代码里的动态引用
- 默认关闭代码压缩，可以通过[minify](/docs/apis/config/output/build-config/bundle-options#minify)开启，有`esbuild`和`terser`两种压缩方式

### bundleless

对于bundleless这种场景，我们对项目中的目录有着明确的[文件约定](http://localhost:3000/docs/apis/hooks/module/src/)(可以通过[bundlelessOptions](/docs/apis/config/output/build-config/bundleless-options)更改)，我们采用babel做js代码转换操作，你可以通过[tools.babel](/docs/apis/config/tools/babel)来设定babel编译的配置。

bundleless构建过程会对 `src` 目录下的 JS(X)、TS(X) 文件进行构建，默认情况下构建的产物会输出到 `dist/js/modern`、`dist/js/treeshaking`、`dist/js/node` 这三种目录下。
其中
- `dist/js/modern` 对应 `ES6`的语法以及使用 `ES Module` 模块化系统的构建产物。
- `dist/js/treeshaking` 对应 `ES5`的语法以及使用 `ES Module` 模块化系统的构建产物。
- `dist/js/modern` 对应 `ES6`的语法以及使用 `CommonJS` 模块化系统的构建产物。


如果项目是一个 TypeScript 项目，那么会在 `dist/types` 目录下生成 `src` 目录里 TS 文件对应的 `*.d.ts` 类型文件。
我们可以在项目的 `package.json` 中的 `types` 字段使用它：

```json
{
  "types": "./dist/types/index.d.ts",
}
```

构建过程中还会对 `src`、`styles`（如果存在的话） 目录下的其他代码进行处理。
- 对于 `src` 目录下的样式代码其构建产物会被输出到 `dist/js/styles` 目录下
- 对于 `src` 目录下的其他静态资源文件会被复制到 `dist/js/styles` 目录下面，如果在 JS(X)、TS(X) 代码中导入了这些静态文件，则会修改原本的指向路径。
- 对于 `styles` 目录下的样式代码其构建产物会被输出到 `dist/styles` 目录下。


## 构建支持
### 模块类型

模块工程方案支持了丰富的模块类型，常见的模块包括
- ECMAScript 模块
- CommonJS 模块
- 资源模块

通过插件系统我们可以自由的扩展模块，你几乎可以将所有的文件以模块的形式集成进来，通过插件的方式，我们已经内置支持了更多的模块类型，其中包括
- TypeScript
- Sass
- Less

### 产物格式
目前主流的模块系统主要是ESM（ECMA Script Module）和CJS(CommonJS)。模块工程方案对这两者都做了支持，并且还支持UMD（Universal Module Definition），兼容AMD（Asynchronous module definition）和CJS的一种通用模块定义。默认为ESM，你也可以通过[format](/docs/apis/config/output/build-config/format)设置产物格式

### 目标环境

模块工程方案里默认支持所有最新的JS特性，即`esnext`，你也可以通过[target](/docs/apis/config/output/build-config/target)设置生成JS代码的目标环境

### 类型文件

模块工程方案里内置了对于ts的支持，同时支持生成d.ts文件，你可以通过[enableDts](/docs/apis/config/output/build-config/enable-dts)和[dtsOnly](/docs/apis/config/output/build-config/dts-only)设置只否生成以及只生成d.ts文件，在**bundle**模式下，d.ts文件也会被打包。
