---
sidebar_position: 3
---

# Modify the output

## Default output artifacts

When you use the `modern build` command in an initialized project, Modern.js Module will generate corresponding build artifacts based on the current configuration.

The default configuration is as follows:

```ts title="modern.config.ts"
import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // Register the CLI tool of Modern.js Module
  plugins: [moduleTools()],
  // Specify the build preset configuration
  buildPreset: 'npm-library',
});
```

**The default output files has the following characteristics**.

- will generate [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules) and [ESM](https://nodejs.org/api/esm.html#modules-ecmascript-modules).
- The code syntax is supported up to `ES6` , and more advanced syntax will be converted.
- All code is bundled into one file, i.e. **bundle** processing is performed.
- The output root directory is the `dist` directory under the project, and the type file output directory is `dist/types`.

You may have the following questions when you see this.

1. what is `buildPreset`?
2. what determines these characteristics of the product?

Then the next step is to first explain `buildPreset`.

## buildPreset

The `buildPreset` represents a prepared set or sets of build-related configurations that can be used to eliminate the trouble and complexity of configuration by using the default values corresponding to the build Preset, resulting in the expected product.

Modern.js Module mainly comes with two built-in build presets, including:

- npm-component: Used to build component libraries.
- npm-library: Used to package projects of other library types, such as tool libraries.

It also provides some variations, such as `npm-library-with-umd` and `npm-library-es5`, which, as their names suggest, correspond to library presets with umd output and support for es5 syntax, respectively. For more detailed configuration, you can refer to its [API](/api/config/build-preset).

In addition, we can also fully customize the build configuration:

## buildConfig

**`buildConfig` is a configuration option that describes how to compile and generate build artifacts**. What was mentioned at the beginning about "_features of build artifacts_" are actually properties supported by `buildConfig`. The currently supported properties cover the needs of most module type projects when building artifacts. `buildConfig` not only contains some properties that artifacts have, but also contains some features needed to build artifacts. The following is a brief list from a classification point of view.

**The basic attributes of a build artifacts include:**

- Whether the artifact is bundled or not: the corresponding API is [`buildConfig.buildType`](/api/config/build-config#buildtype).
- Product support for syntax: the corresponding API is [`buildConfig.target`](/api/config/build-config#target).
- Output format: the corresponding API is [`buildConfig.format`](/api/config/build-config#format).
- How the output type file is handled: the corresponding API is [`buildConfig.dts`](/api/config/build-config#dts).
- How the sourceMap of the artifact is handled: the corresponding API is [`buildConfig.sourceMap`](/api/config/build-config#sourcemap).
- The input (or source file) corresponding to the output: the corresponding API is [`buildConfig.input`](/api/config/build-config#input).
- The directory of the output of the artifact: the corresponding API is [`buildConfig.outDir`](/api/config/build-config#outdir).
- Build source directory: the corresponding API is [`buildConfig.sourceDir`](/api/config/build-config#sourcedir).

**Common functions required for build artifacts include:**

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
- Specify whether the build artifacts is for the NodeJS environment or the browser environment: the corresponding API is [`buildConfig.platform`](/api/config/build-config#platform).
- umd product-related.
  - Specifies the global variables imported externally to the umd product: the corresponding API is [`buildConfig.umdGlobals`](/api/config/build-config#umdglobals).
  - Specify the module name of the umd product: the corresponding API is [`buildConfig.umdModuleName`](/api/config/build-config#umdmodulename).

In addition to the above categories, frequently asked questions and best practices about these APIs can be found at the following links

- [About `bundle` and `bundleless`?](/guide/advance/in-depth-about-build#bundle--bundleless)
- [About `input` and `sourceDir`](/guide/advance/in-depth-about-build#input--sourcedir)
- [About d.ts](/guide/advance/in-depth-about-build#dts).
- [How to use define](/guide/advance/in-depth-about-build#define)
- [How to handle third-party dependencies?](/guide/advance/external-dependency)
- [How to use copy?](/guide/advance/copy)
- [How to use umd](/guide/advance/build-umd)
- [How to use asset](/guide/advance/asset)

## Combining Configuration and Presets

Once we understand `buildPreset` and `buildConfig`, we can use them together.

In a real project, we can use `buildPreset` to quickly get a set of default build configurations. If you need to customise it, you can use `buildConfig` to override and extend it.

The extension logic is as follows.

- When `buildConfig` is an array, new configuration items are added to the original preset.

```ts title="modern.config.ts"
import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
  buildConfig: [
    {
      format: 'iife',
      target: 'es2020',
      outDir: '. /dist/global'
    }
  ]
});
```

This will generate an additional IIFE-formatted product that supports up to ES2020 syntax on top of the original preset, in the `dist/global` directory under the project.

- When `buildConfig` is an object, the configuration items in the object are overwritten in the preset.

```ts title="modern.config.ts"
import { moduleTools, defineConfig } from '@modern-js/module-tools';
export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
  buildConfig: {
    sourceMap: true,
  },
}).
```

This will cause a sourceMap file to be generated for each build task.
