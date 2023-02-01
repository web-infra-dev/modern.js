---
sidebar_position: 3
---
# modify-output-product

## Modify the output product

## Default output products

When the `modern build` command is used in an initialized project, the products are generated according to the default configuration supported by Module Tools. The default supported configurations are specified as follows.

```typescript
import moduleTools, { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
});
```

**The default generation product has the following characteristics**.

- will generate [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules) and [ESM](https://nodejs.org/api/esm.html#modules- ecmascript-modules).
- The code syntax is supported up to `ES6` , and more advanced syntax will be converted.
- All code is packaged into one file, i.e. **bundle** processing is performed.
- The output root directory is the `dist` directory under the project, and the type file output directory is `dist/types`.

You may have the following questions when you see this.

1. what is `buildPreset`?
2. what determines these characteristics of the product?

Then the next step is to first explain `buildPreset`.

## buildPreset

The `buildPreset` represents one or more sets of build-related configurations prepared in advance. By using the corresponding preset values of the `buildPreset`, you can eliminate the troublesome and complicated configuration work and get the expected product.

### String form of build preset

The value of a **build preset can be in the form of a string**, so a build preset of this form is called a preset string.

The module engineering solution provides generic build preset strings and corresponding variants, depending on the generic scenario in which the npm package is used. All currently supported preset strings can be viewed via the [BuildPreset API](/api/config/build-preset). Here is an explanation about the relationship between **generic preset strings and variants**.

Among the generic preset strings, `"npm-library"` can be used in the scenario of developing npm packages of the library type, which is suitable for most common module type projects. When `"npm-library"` is set, the output product of the project will have the following characteristics.

- In the `dist/lib` directory you will get code formatted as `cjs`, syntax supported up to `es6` and packaged.
- In the `dist/es` directory, you get code in the format `esm`, with syntax support up to `es6` and after packaging.
- In the `dist/types` directory, you get the type files. If it is not a TypeScript project, there is no such directory.

The default string `"npm-library"` is a variant of the original product with a modified **code syntax support** feature and a string naming change to `"npm-library-[es5 | es2016.... . es2020 | esnext]"`.

For example, if the output product is based on the preset string `"npm-library"` and the syntax supported by the product code is changed to `es5`, then simply changing `"npm-library"` to `"npm-library-es5"` would be sufficient.

### Build pre-defined function forms

**In addition to the string form, the value of a build preset can also be in the form of a function, where the specific configuration corresponding to a preset value can be printed or modified**.

For example, to achieve the same effect as the preset string ``npm-library-es5"` using the form of a preset function, you can do the following.

```typescript
import moduleTools, { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildPreset({ preset }) {
    return preset.NPM_LIBRARY.map(config => {
      return { ... .config, target: 'es5' }
    });
  },
});
```

In the above code implementation, `preset.NPM_LIBRARY` corresponds to the preset string `"npm-library"`, which represents the equivalent of `"npm-library"` for multiple sets of build-related configurations. We traverse the `NPM_LIBRARY` array, which contains multiple `buildConfig` objects, using the `map` method. We made a shallow copy of the original `buildConfig` object and modified the value of the `target` after the shallow copy, specifying it as `es5`.


> NPM_LIBRARY`, you can check it with [BuildPreset API](/api/config/build-preset). The`preset`object contains not only`NPM_LIBRARY`, but also other similar constants.
> We can not only use `preset.NPM_LIBRARY` to get the build configuration corresponding to `"npm-library"`, but also `preset['npm-library']` in this way.

So what is the `buildConfig` object here? What is the basis for the build product feature mentioned before?

Let's explain next.

## Build configuration (object)

**`buildConfig` is a configuration object that describes how to compile and generate build products**. What was mentioned at the beginning about "_features of build products_" are actually properties supported by `buildConfig`. The currently supported properties cover the needs of most module type projects when building products. `buildConfig` not only contains some properties that products have, but also contains some features needed to build products. The following is a brief list from a classification point of view.

**The basic attributes of a build product include:**

- Whether the product is packaged or not: the corresponding API is [`buildConfig.buildType`](/api/config/build-config#buildtype).
- Product support for syntax: the corresponding API is [`buildConfig.target`](/api/config/build-config#target).
- Output format: the corresponding API is [`buildConfig.format`](/api/config/build-config#format).
- How the output type file is handled: the corresponding API is [`buildConfig.dts`](/api/config/build-config#dts).
- How the sourceMap of the product is handled: the corresponding API is [`buildConfig.sourceMap`](/api/config/build-config#sourcemap).
- The input (or source file) corresponding to the output: the corresponding API is [`buildConfig.input`](/api/config/build-config#input).
- The directory of the output of the product: the corresponding API is [`buildConfig.outDir`](/api/config/build-config#outDir).
- Build source directory: the corresponding API is [`buildConfig.sourceDir`](/api/config/build-config#sourcedir).

**Common functions required for build products include:**

- Alias: The corresponding API is [`buildConfig.alias`](/api/config/build-config#alias).
- Static resource handling: the corresponding API is [`buildConfig.asset`](/api/config/build-config#asset).
- Third-party dependency handling: The corresponding APIs are
  - [`buildConfig.autoExternal`](/api/config/build-config#autoexternal).
  - [`buildConfig.externals`](/api/config/build-config#externals).
- Copy: The corresponding API is [`buildConfig.copy`](/api/config/build-config#copy).
- Global variable substitution: the corresponding API is [`buildConfig.define`](/api/config/build-config#define).
- Specify [JSX](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) compilation method, the corresponding API is [`buildConfig.jsx`](/api/config/ build-config#jsx).

**Some advanced properties or less frequently used functions:**

- Product code compression: The corresponding API is [`buildConfig.minify`](/api/config/build-config#minify).
- Code splitting: [`buildConfig.splitting`](/api/config/build-config#splitting)
- Specify whether the build product is for the NodeJS environment or the browser environment: the corresponding API is [`buildConfig.platform`](/api/config/build-config#platform).
- umd product-related.
  - Specifies the global variables imported externally to the umd product: the corresponding API is [`buildConfig.umdGlobals`](/api/config/build-config#umdglobals).
  - Specify the module name of the umd product: the corresponding API is [`buildConfig.umdModuleName`](/api/config/build-config#umdmodulename).

In addition to the above categories, frequently asked questions and best practices about these APIs can be found at the following links

- [What are `bundle` and `bundleless`?](/guide/advance/in-depth-about-build#bundle- and-bundleless)
- [Relationship of `input` to `sourceDir`](/guide/advance/in-depth-about-build#input- to -sourcedir-)
- [Multiple ways to generate type files in product](/guide/advance/in-depth-about-build#type-files).
- [`buildConfig.define` Different ways to use it for different scenarios.](/guide/advance/in-depth-about-build#buildconfigdefine - How to use it for different scenarios)
- [How to handle third-party dependencies?](/guide/advance/external-dependency)
- [How to use copy?](/guide/advance/copy)
- How do I build umd products? (/guide/advance/build-umd# sets the global variable name of the project)
- [The capabilities currently supported by static resources.](/guide/advance/asset)

## When to use `buildConfig`

`buildConfig` is one of the methods used to modify the product, **only `buildConfig` will take effect when configured in conjunction with `buildPreset`**. So if configured as follows.

```typescript
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    format: 'umd',
  },
  buildPreset: 'npm-library',
});
```

Then at this point you will see the following prompt.

```bash
Since both 'buildConfig' and 'buildPreset' are present, only the 'buildConfig' configuration will take effect
```

The set or sets of build-related configurations represented by `buildPreset` are composed of `buildConfig`, **which can be used to customize output products** when the current project needs cannot be met using `buildPreset`.

The process of using `buildConfig` is the process of thinking about **what kind of build product to get**.
