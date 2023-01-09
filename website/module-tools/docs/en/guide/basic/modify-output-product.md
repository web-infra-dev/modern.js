---
sidebar_position: 3
---

# modify-output-product

## Modify output product

## Default output products

When the `modern build` command is used in an initialized project, the products are generated according to the default configuration supported by Module Tools. The default supported configurations are as follows.

```typescript
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildPreset: 'base-config',
});
```

**The default generated product has the following characteristics**:

- The code format is [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules), or simply `cjs`.
- Code syntax is supported up to `ES6`.
- All code is packaged into a single file, i.e. **bundle** processing is performed.
- The output root directory is the `dist` directory under the project, and the output directory for type files is `dist/types`.

:::tip

1. By "code syntax support up to ES6", we mean that the syntax supported by the product code will not exceed `ES6`. If the source code uses syntax above `ES6` (e.g. `ES2017`), it will be converted.

:::

You may have the following questions when you see this:

1. what is `buildPreset`?
2. what determines these characteristics of the output?

Then the next step is to first explain `buildPreset`.

## buildPreset

`buildPreset` represents one or more sets of build-related configurations prepared in advance. By using the corresponding preset values of `buildPreset`, you can eliminate the troublesome and complicated configuration work and get the expected product.

### String form of `buildPreset`

The value of a **build preset can be in the form of a string**, so a build preset of this form is called a preset string.

The module engineering solution provides generic build preset strings and corresponding variants, depending on the generic scenario in which the npm package is used. All currently supported preset strings can be viewed via the [BuildPreset API](/en/api/config/build-config). The relationship between **generic preset strings and variants** is explained here.

Among the generic preset strings, `"npm-library"` can be used in the scenario of developing npm packages of the library type, which is suitable for most common module type projects. When `"npm-library"` is set, the output product of the project will have the following characteristics:

- In the `dist/lib` directory you will get the product in the code format `cjs`, with syntax support up to `es6` and after packaging.
- In the `dist/es` directory, you get code in the format `esm`, with syntax support up to `es6` and packaged.
- In the `dist/types` directory, you get the type files. If it is not a TypeScript project, there is no such directory.

The default string `"npm-library"` is a variant of the original product with modified **code-syntax support** and a string naming change to `"npm-library-[es5 | es2016.... . es2020 | esnext]"`.

For example, if the output product is based on the preset string `"npm-library"` and the syntax supported by the product code is changed to `es2017`, then simply changing `"npm-library"` to `"npm-library-es2017"` would be sufficient.

### Function form of `buildPreset`

**In addition to the string form, the value of a build preset can also be in the form of a function, where the specific configuration corresponding to a preset value can be printed or modified**.

For example, if the same effect as the preset string `"npm-library-es2017"` is achieved using the preset function form, it can be done as follows:

```typescript
import { defineConfig } from "@modern-js/module-tools";

export default defineConfig({
  buildPreset({ preset }) {
    return preset.NPM_LIBRARY.map(config => {
      return { ... .config, target: 'es2017' }
    });
  },
});
```

In the above code implementation, `preset.NPM_LIBRARY` corresponds to the preset string `"npm-library"`, which represents the `"npm-library"` equivalent of a multi-group build-related configuration. We traverse the `NPM_LIBRARY` array, which contains multiple `buildConfig` objects, with the `map` method. We make a shallow copy of the original `buildConfig` object and modify the shallow copy to get `buildConfig.target`, specifying it as `es2017`.

> The specific value of `preset.NPM_LIBRARY` can be viewed via the [BuildPreset API](/en/api/config/build-config). The `preset` object contains not only `NPM_LIBRARY`, but also other similar constants.

So what is the `buildConfig` object here? And what are the previously mentioned build product features based on?

We explain it next.

## Build configuration (object)

**`buildConfig` is a configuration object that describes how to compile and generate build products**. What was mentioned at the beginning about "_features of build products_" are actually properties supported by `buildConfig`. The currently supported properties cover the needs of most module type projects when building products. `buildConfig` not only contains some of the properties that products have, but also some of the features needed to build products. The following is a brief list from a classification point of view:

**The basic attributes of a build product include:**

- Whether the product is packaged or not: the corresponding API is [`buildConfig.buildType`](/en/api/config/build-config#buildtype).
- Product support for syntax: the corresponding API is [`buildConfig.target`](/en/api/config/build-config#target).
- Output format: The corresponding API is [`buildConfig.format`](/en/api/config/build-config#format).
- How to handle the output type file: the corresponding API is [`buildConfig.dts`](/en/api/config/build-config#dts).
- How the sourceMap of the product is handled: the corresponding API is [`buildConfig.sourceMap`](/en/api/config/build-config#sourcemap).
- The input (or source file) corresponding to the output: the corresponding API is [`buildConfig.input`](/en/api/config/build-config#input).
- The directory of the output of the product: the corresponding API is [`buildConfig.outDir`](/en/api/config/build-config#outDir).
- The source directory of the build: the corresponding API is [`buildConfig.sourceDir`](/en/api/config/build-config#sourcedir).

**Common functions needed to build products include:**

- Alias: The corresponding API is [`buildConfig.alias`](/en/api/config/build-config#alias).
- Static resource handling: The corresponding API is [`buildConfig.asset`](/en/api/config/build-config#asset).
- Third-party dependency handling: The corresponding APIs are
  - [`buildConfig.autoExternal`](/en/api/config/build-config#autoexternal).
  - [`buildConfig.externals`](/en/api/config/build-config#externals).
- Copy: The corresponding API is [`buildConfig.copy`](/en/api/config/build-config#copy).
- Global variable substitution: the corresponding API is [`buildConfig.define`](/en/api/config/build-config#define).
- Specify [JSX](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) compilation method, the corresponding API is [`buildConfig.jsx`](/en/api/config/build-config#jsx).

**Some advanced properties or less frequently used functions:**

- Product code compression: The corresponding API is [`buildConfig.minify`](/en/api/config/build-config#minify).
- Code splitting: [`buildConfig.splitting`](/en/api/config/build-config#splitting)
- Specify whether the build product is for the NodeJS environment or the browser environment: the corresponding API is [`buildConfig.platform`](/en/api/config/build-config#platform).
- umd product-related.
  - Specifies the global variables imported externally to the umd product: the corresponding API is [`buildConfig.umdGlobals`](/en/api/config/build-config#umdglobals).
  - Specify the module name of the umd product: the corresponding API is [`buildConfig.umdModuleName`](/en/api/config/build-config#umdmodulename).

In addition to the above categories, frequently asked questions and best practices about these APIs can be found at the following links.

- [What are `bundle` and `bundleless`?](/en/guide/advance/in-depth-about-build#bundle-and-bundleless)
- [The relationship between `input` and `sourceDir`](/en/guide/advance/in-depth-about-build#relationship-between-input-and-sourcedir)
- [The multiple ways of generating type files in products](/en/guide/advance/in-depth-about-build#declaration-type-files)
- [The use of `buildConfig.define` for different scenarios.](/en/guide/advance/in-depth-about-build#buildconfigdefine-usage-for-different-scenarios)
- [How to handle third-party dependencies?](/en/guide/advance/external-dependency)
- [How to use copy?](/en/guide/advance/copy)
- [How to build umd products?](/en/guide/advance/build-umd)
- [The capabilities currently supported by static resources.](/en/guide/advance/asset)

## When to use `buildConfig`

`buildConfig` is one of the ways used to modify the product, **and only `buildConfig` will take effect when configured in conjunction with `buildPreset`**. So if configured as follows.

```typescript
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: [{}],
  buildPreset: 'base-config',
});
```

Then at this point you will see the following prompt.

```bash
Since both 'buildConfig' and 'buildPreset' are present, only the 'buildConfig' configuration will take effect
```

The set or sets of build-related configurations represented by `buildPreset` are composed of `buildConfig`, **which can be used to customize output products** when the current project needs cannot be met using `buildPreset`.

The process of using `buildConfig` is the process of thinking about "_what kind of build product to get_".
