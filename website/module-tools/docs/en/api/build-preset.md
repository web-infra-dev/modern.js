# BuildPreset
A build preset string or preset function. Provides out-of-the-box build configuration

- type: `string | Function`
- default: `undefined`


## string

The string form allows you to use the built-in presets directly

```js
export default {
  buildPreset: 'npm-library',
};
```


### ``npm-library'`
Library generic schema used under class [NPM](https://www.npmjs.com/) package manager, contains `esm` and `cjs` Bundle products, and includes a type file.

:::info
About the class [NPM](https://www.npmjs.com/) Package Manager
* [npm](https://www.npmjs.com)
* [yarn](https://yarnpkg.com/)
* [pnpm](https://pnpm.io/)
:::

```json title="package.json"
{
    "main": ". /dist/lib/index.js",
    "module": ". /dist/es/index.js",
    "types": ". /dist/types/index.d.ts",
}
```
The build configuration corresponding to the preset string.
```js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outdir: '. /lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outdir: '. /es',
  },
  {
    buildType: 'bundle',
    outdir: '. /types',
    dts: {
      only: true,
    },
  },
];
```

### ``npm-library-with-umd'``
Used under class [NPM](https://www.npmjs.com/) package manager, and Library supports a similar pattern to [unpkg](https://unpkg.com/). Additional ``umd`` products are provided on top of the pre-defined ``npm-library'`.

```json title="package.json"
{
    "main": ". /dist/lib/index.js",
    "module": ". /dist/es/index.js",
    "types": ". /dist/types/index.d.ts",
    "unpkg": ". /dist/umd/index.js",
};
```
The build configuration corresponding to the preset string.
```js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outdir: '. /lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outdir: '. /es',
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    outdir: '. /umd',
  },
  {
    buildType: 'bundle',
    outdir: '. /types',
    dts: {
      only: true,
    },
  },
];
```

### `'npm-component'`
A generic pattern for components (libraries) used under the class [NPM](https://www.npmjs.com/) package manager. Contains both `esm` and `cjs` Bundleless products (for easy *[Tree shaking](https://developer.mozilla.org/zh-CN/docs/Glossary/Tree_shaking)* optimization), as well as including a copy of the type file.

For style files included in the source code, the products provide the compiled product of the style and the source file of the style.

```json title="package.json"
{
    "main": ". /dist/lib/index.js", // bundleless type
    "module": ". /dist/es/index.js", // bundleless type
    "types": ". /dist/types/index.d.ts",
};
```
The pre-defined strings correspond to the build configuration.

``` js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outdir: '. /lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outdir: '. /es',
  },
  {
    buildType: 'bundleless',
    outdir: '. /types',
    dts: {
      only: true,
    },
  },
];
```

### `'npm-component-with-umd'`

Component (library) used under class [NPM](https://www.npmjs.com/) package manager, with support for class [unpkg](https://unpkg.com/) schema. Additional ``umd`` products are provided on top of the pre-defined ``npm-component'`.
```json title="package.json"
{
    "main": ". /dist/lib/index.js", // bundleless type
    "module": ". /dist/es/index.js", // bundleless type
    "types": ". /dist/types/index.d.ts",
    "unpkg": ". /dist/umd/index.js",
};
```
```js
export const buildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outdir: '. /lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outdir: '. /es',
  },
   {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    outdir: '. /umd',
  },
  {
    buildType: 'bundleless',
    outdir: '. /types',
    dts: {
      only: true,
    },
  },
];
```

### About the ECMAScript versions supported by the preset and `{es5.... .esnext}`


When you want to use a `buildPreset` preset that supports other ECMAScript versions, you can directly add the supported versions to the `'npm-library'`, `'npm-library-with-umd'`, `'npm-component'`, `'npm-component-with-umd'` presets.

For example, if you want the ``npm-library'` preset to support ``es2017``, you can configure it as follows.

```js
export default {
  buildPreset: 'npm-library-es2017',
};
```

## Function

The way the function is configured, you can get the preset value with the `preset` parameter and then modify the build configuration inside to customize your build configuration.
The following is an example of how a function can be configured to compress a build product.

```js
export default {
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
}
```
