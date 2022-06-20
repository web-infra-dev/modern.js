---
sidebar_label: buildPreset
---

# output.buildPreset

:::info 适用的工程方案
* 模块
:::

* 类型： `'npm-library'`
| `'npm-library-with-umd'`
| `'npm-component'`
| `'npm-component-with-umd'`
| `undefined`;
* 默认值： `undefined`

构建预设，提供开箱即用的构建配置

所有预设的语法支持默认为`es6`，可在预设值后增加 -[target] 来改变,如`'npm-library-es5'`

## 'npm-library'
在类 Npm 包管理器下使用的 Library 通用模式，包含 esm 和 cjs 两种 bundle 产物，并且包含一份类型文件。
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
    buildAction: 'bundle',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundle',
    outputPath: './es',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundle',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```

## npm-library-with-umd
在类 Npm 包管理器下使用，并且 Library 支持类似 unpkg的模式。在通用模式的基础上，额外提供 umd 产物
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
    buildAction: 'bundle',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundle',
    outputPath: './es',
  },
  {
    format: 'umd',
    target: 'es6',
    buildAction: 'bundle',
    outputPath: './umd',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundle',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```

## 'npm-component'
在类 Npm 包管理器下使用的 组件（库）通用模式。包含 esm 和 cjs 两种 bundleless 产物（便于treeshaking）；包含一份类型文件。对于样式文件，仅提供样式的编译产物。
```json title="package.json"
{
    "main": "./dist/lib/index.js", // bundleless type
    "module": "./dist/es/index.js", // bundleless type
    "types": "./dist/types/index.d.ts",
};
```
预设字符串对应的构建配置：
```js
export const configs = [
  {
    format: 'cjs',
    target: 'es6',
    buildAction: 'bundleless',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundleless',
    outputPath: './es',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundleless',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```

## 'npm-component-with-umd'
在类 Npm 包管理器下使用， 同事支持类 unpkg 的模式的组件（库）。 在组件通用模式的基础上，额外提供 umd 产物。
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
    buildAction: 'bundleless',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundleless',
    outputPath: './es',
  },
   {
    format: 'umd',
    target: 'es6',
    buildAction: 'bundle',
    outputPath: './umd',
  },
  {
    format: 'esm',
    target: 'es6',
    buildAction: 'bundleless',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
```



