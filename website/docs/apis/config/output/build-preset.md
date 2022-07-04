---
sidebar_label: buildPreset
---

# output.buildPreset

:::info 适用的工程方案
* 模块
:::

* 类型：
  + `'npm-library'` | `'npm-library-with-umd'` | `'npm-component'` | `'npm-component-with-umd'`
  + `'npm-library-{es5...esnext}'`
  + `'npm-library-with-umd-{es5...esnext}'`
  + `'npm-component-{es5...esnext}'`
  + `'npm-component-with-umd-{es5...esnext}'`
* 默认值：当前版本无默认值，默认不开启该功能

构建配置的预设字符串。提供开箱即用的构建配置。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildPreset: 'npm-library',
  },
});
```

:::caution 注意
该配置在下一个大版本会作为主要的构建配置，推荐使用。
:::

## `'npm-library'`
在类 [NPM](https://www.npmjs.com/) 包管理器下使用的 Library 通用模式，包含 `esm` 和 `cjs` 两种 Bundle 产物，并且包含一份类型文件。

:::info 关于类 [NPM](https://www.npmjs.com/) 包管理器
* [npm](https://www.npmjs.com)
* [yarn](https://yarnpkg.com/)
* [pnpm](https://pnpm.io/)
:::

```json title="package.json"
{
    "main": "./dist/lib/index.js",
    "module": "./dist/es/index.js",
    "types": "./dist/types/index.d.ts",
}
```
预设字符串对应的构建配置：
```js
export const configs = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './es',
  },
  {
    buildType: 'bundle',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```

## `'npm-library-with-umd'`
在类 [NPM](https://www.npmjs.com/) 包管理器下使用，并且 Library 支持类似 [unpkg](https://unpkg.com/) 的模式。在预设 `'npm-library'` 的基础上，额外提供 `umd` 产物。

```json title="package.json"
{
    "main": "./dist/lib/index.js",
    "module": "./dist/es/index.js",
    "types": "./dist/types/index.d.ts",
    "unpkg": "./dist/umd/index.js",
};
```
预设字符串对应的构建配置：
```js
export const configs = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './es',
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './umd',
  },
  {
    buildType: 'bundle',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```

## `'npm-component'`
在类 [NPM](https://www.npmjs.com/) 包管理器下使用的 组件（库）通用模式。包含 `esm` 和 `cjs` 两种 Bundleless 产物（便于 *[Tree shaking](https://developer.mozilla.org/zh-CN/docs/Glossary/Tree_shaking)* 优化），以及包含一份类型文件。

对于源码中包含的样式文件，产物中提供样式的编译产物和样式的源文件。

```json title="package.json"
{
    "main": "./dist/lib/index.js", // bundleless type
    "module": "./dist/es/index.js", // bundleless type
    "types": "./dist/types/index.d.ts",
};
```
预设字符串对应的构建配置：

``` js
export const configs = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './es',
  },
  {
    buildType: 'bundleless',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```

## `'npm-component-with-umd'`

在类 [NPM](https://www.npmjs.com/) 包管理器下使用的组件（库），同时支持类 [unpkg](https://unpkg.com/) 的模式。 在预设 `'npm-component'` 的基础上，额外提供 `umd` 产物。
```json title="package.json"
{
    "main": "./dist/lib/index.js", // bundleless type
    "module": "./dist/es/index.js", // bundleless type
    "types": "./dist/types/index.d.ts",
    "unpkg": "./dist/umd/index.js",
};
```
```js
export const configs = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './es',
  },
   {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './umd',
  },
  {
    buildType: 'bundleless',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```

## 关于预设值支持的 ECMAScript 版本以及 `{es5...esnext}`

对于 `'npm-library'` | `'npm-library-with-umd'` | `'npm-component'` | `'npm-component-with-umd'` 这些预设值，其构建产物支持的最高 ECMAScript 版本为 `es6`。

当想要使用支持其他 ECMAScript 版本的 `buildPreset` 预设的时候，可以直接在 `'npm-library'`、`'npm-library-with-umd'`、`'npm-component'`、`'npm-component-with-umd'` 这些预设值后面增加想要支持的版本。

例如希望 `'npm-library'` 预设支持 `es2015`，则可以按照如下方式配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildPreset: 'npm-library-es2015',
  },
});
```
