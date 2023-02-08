---
sidebar_position: 2
---

# BuildPreset

构建的预设字符串或者预设函数。提供开箱即用的构建配置。

- type: `string | Function`
- default: `undefined`

## string

字符串的形式可以让你直接使用内置的预设。

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildPreset: 'npm-library',
});
```

### `'npm-library'`

在类 [NPM](https://www.npmjs.com/) 包管理器下使用的 Library 通用模式，包含 `esm` 和 `cjs` 两种 Bundle 产物，并且包含一份类型文件。

:::info
关于类 [NPM](https://www.npmjs.com/) 包管理器

- [npm](https://www.npmjs.com)
- [yarn](https://yarnpkg.com/)
- [pnpm](https://pnpm.io/)

:::

```json package.json
{
  "main": "./dist/lib/index.js",
  "module": "./dist/es/index.js",
  "types": "./dist/types/index.d.ts"
}
```

预设字符串对应的构建配置：

```js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/es',
  },
  {
    buildType: 'bundle',
    outDir: './dist/types',
    dts: {
      only: true,
    },
  },
];
```

### `'npm-library-with-umd'`

在类 [NPM](https://www.npmjs.com/) 包管理器下使用，并且 Library 支持类似 [unpkg](https://unpkg.com/) 的模式。在预设 `'npm-library'` 的基础上，额外提供 `umd` 产物。

```json package.json
{
    "main": "./dist/lib/index.js",
    "module": "./dist/es/index.js",
    "types": "./dist/types/index.d.ts",
    "unpkg": "./dist/umd/index.js",
};
```

预设字符串对应的构建配置：

```js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/es',
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/umd',
  },
  {
    buildType: 'bundle',
    outDir: './dist/types',
    dts: {
      only: true,
    },
  },
];
```

### `'npm-component'`

在类 [NPM](https://www.npmjs.com/) 包管理器下使用的 组件（库）通用模式。包含 `esm` 和 `cjs` 两种 Bundleless 产物（便于 _[Tree shaking](https://developer.mozilla.org/zh-CN/docs/Glossary/Tree_shaking)_ 优化），以及包含一份类型文件。

对于源码中包含的样式文件，产物中提供样式的编译产物和样式的源文件。

```json package.json
{
    "main": "./dist/lib/index.js", // bundleless type
    "module": "./dist/es/index.js", // bundleless type
    "types": "./dist/types/index.d.ts",
};
```

预设字符串对应的构建配置：

```js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/es',
  },
  {
    buildType: 'bundleless',
    outDir: './dist/types',
    dts: {
      only: true,
    },
  },
];
```

### `'npm-component-with-umd'`

在类 [NPM](https://www.npmjs.com/) 包管理器下使用的组件（库），同时支持类 [unpkg](https://unpkg.com/) 的模式。 在预设 `'npm-component'` 的基础上，额外提供 `umd` 产物。

```json package.json
{
    "main": "./dist/lib/index.js", // bundleless type
    "module": "./dist/es/index.js", // bundleless type
    "types": "./dist/types/index.d.ts",
    "unpkg": "./dist/umd/index.js",
};
```

```js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/es',
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/umd',
  },
  {
    buildType: 'bundleless',
    outDir: './dist/types',
    dts: {
      only: true,
    },
  },
];
```

### 关于预设值支持的 ECMAScript 版本以及 `{es5...esnext}`

当想要使用支持其他 ECMAScript 版本的 `buildPreset` 预设的时候，可以直接在 `'npm-library'`、`'npm-library-with-umd'`、`'npm-component'`、`'npm-component-with-umd'` 这些预设值后面增加想要支持的版本。

例如希望 `'npm-library'` 预设支持 `'es2017'`，则可以按照如下方式配置：

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildPreset: 'npm-library-es2017',
});
```

## Function

函数的配置方式，可以通过 `preset` 参数获取到预设值，然后对里面的构建配置进行修改来自定义你的构建配置。
以下是一个函数的配置方式的例子，它配置了压缩构建产物的功能：

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildPreset({ preset }) {
    const { NPM_LIBRARY } = preset;
    return NPM_LIBRARY.map(config => {
      config.minify = {
        compress: {
          drop_console: true,
        },
      };
      return config;
    });
  },
});
```
