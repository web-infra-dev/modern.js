---
sidebar_position: 1
---

# In-depth understanding of build

In the "Basic Usage" section, we already knew that you can modify the output files of a project through the `buildConfig` configuration. `buildConfig` not only describes some of the features of the product, but also provides some functionality for building the product.

:::tip
If you are not familiar with `buildConfig`, please read [modify-output-product](/en/guide/basic/modify-output-product).
:::

In this chapter we'll dive into the use of certain build configurations and understand what happens when the `modern build` command is executed.

## `bundle` / `bundleless`

So first let's understand bundle and bundleless.

A bundle is a package of build artifacts, which may be a single file or multiple files based on a certain [code splitting strategy](https://esbuild.github.io/api/#splitting).

bundleless, on the other hand, means that each source file is compiled and built separately, but not bundled together. Each output file can be found with its corresponding source code file. The process of **bundleless build can also be understood as the process of code conversion of source files only**.

They have their own benefits.

- bundle can reduce the size of build artifacts and also pre-package dependencies to reduce the size of installed dependencies. Packaging libraries in advance can speed up application project builds.
- bundleless maintains the original file structure and is more conducive to debugging and tree shaking.

:::warning
bundleless is a single-file compilation mode, so for referencing and exporting types, you need to add the `type` keyword. For example, `import type { A } from './types'`. Please refer to the [esbuild documentation](https://esbuild.github.io/content-types/#isolated-modules) for more information.
:::

In `buildConfig` you can specify whether the current build task is bundle or bundleless by using [`buildConfig.buildType`](/en/api/config/build-config#buildtype).

## `input` / `sourceDir`

[`buildConfig.input`](/api/config/build-config#input) is used to specify the path to a file or directory from which to read the source code, the default value of which varies between bundle and bundleless builds:

- When `buildType: 'bundle'`, `input` defaults to `src/index.(j|t)sx?`.
- When `buildType: 'bundleless'`, `input` defaults to `['src']`.

From the default value, we know that **building in bundle mode usually specifies one or more files as the entry point for the build, while building in bundleless mode specifies a directory and uses all the files in that directory as the entry point**.

[`sourceDir`](/api/config/build-config#sourcedir) is used to specify the source directory, which is **only** related to the following two elements:

- Type file generation
- [`outbase`](https://esbuild.github.io/api/#outbase) for specifying the build process

So we can get its best practices:

- **Only specify `input` during the bundle build.**
- **In general, bundleless only needs to specify `sourceDir` (where `input` will be aligned with `sourceDir`).** If we want to use the `input` in bundleless, we only need to specify `sourceDir`.

If you want to convert only some of the files in bundleless, e.g. only the files in the `src/runtime` directory, you need to configure `input`:

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    input: ['src/runtime'],
    sourceDir: 'src',
  },
});
```

## use swc

In some scenarios, esbuild is not enough to meet our needs, and we will use swc to do the code conversion.

Starting from version **MAJOR_VERSION.36.0**, the Modern.js Module will use swc by default when it comes to the following functionality, but that doesn't mean we don't use esbuild any more, the rest of the functionality will still use esbuild.

- [transformImport](/api/config/build-config#transformimport)
- [transformLodash](/api/config/build-config#transformlodash)
- [externalHelpers](/api/config/build-config#externalhelpers)
- [format: umd](api/config/build-config#format-umd)
- [target: es5](api/config/build-config#target)
- [emitDecoratorMetadata: true](https://www.typescriptlang.org/tsconfig#emitDecoratorMetadata)

In fact, we've been using swc for full code conversion since version **MAJOR_VERSION.16.0**. However, swc also has some limitations, so we added [sourceType](/api/config/build-config#sourcetype) to turn off swc when the source is formatted as 'commonjs', which isn't really user-intuitive, and the cjs mode of the swc formatted outputs don't have annotate each export name, which can cause problems in node.
So we deprecated this behaviour and went back to the original design - **using swc as a supplement only in situations where it was needed**.

## Using Hooks to Intervene in the Build Process

The Modern.js Module provides a Hook mechanism that allows us to inject custom logic at different stages of the build process.
The Modern.js Module Hook is implemented using [tapable](https://github.com/webpack/tapable), which extends esbuild's plugin mechanism, and is recommended to be used directly if esbuild plugins already meet your needs.
Here's how to use it:

### Hook type

#### AsyncSeriesBailHook

Serial hooks that stop the execution of other tapped functions if a tapped function returns a non-undefined result.

#### AsyncSeriesWaterFallHooks

Serial hooks whose results are passed to the next tapped function.

### Hook Order

The execution order of hooks follows the registration order. You can control whether a hook is registered before or after the built-in hooks using `applyAfterBuiltIn`.

### Hook API

#### load

- AsyncSeriesBailHook
- Triggered at esbuild [onLoad callbacks](https://esbuild.github.io/plugins/#on-load) to fetch module content based on the module path
- Input parameters

```ts
interface LoadArgs {
  path: string;
  namespace: string;
  suffix: string;
}
```

- Return parameters

```ts
type LoadResult =
  | {
      contents: string; // module contents
      map?: SourceMap; // https://esbuild.github.io/api/#sourcemap
      loader?: Loader; // https://esbuild.github.io/api/#loader
      resolveDir?: string;
    }
  | undefined;
```

- Example

```ts
compiler.hooks.load.tapPromise('load content from memfs', async args => {
  const contents = memfs.readFileSync(args.path);
  return {
    contents: contents,
    loader: 'js',
  };
});
```

#### transform

- AsyncSeriesWaterFallHooks
- Triggered at esbuild [onLoad callbacks](https://esbuild.github.io/plugins/#on-load).
  Transforms the contents of the module fetched during the load phase
- Input parameters (return parameters)

```ts
export type Source = {
  code: string;
  map?: SourceMap;
  path: string;
  loader?: string;
};
```

- Example

```ts
compiler.hooks.transform.tapPromise('6to5', async args => {
  const result = babelTransform(args.code, { presets: ['@babel/preset-env'] });
  return {
    code: result.code,
    map: result.map,
  };
});
```

#### renderChunk

- AsyncSeriesWaterFallHooks
- Triggered at esbuild [onEnd callbacks](https://esbuild.github.io/plugins/#on-end).
  This is similar to the transform hook, but works on the artifacts generated by esbuild.
- Input parameters (return parameters)

```ts
export type AssetChunk = {
  type: 'asset';
  contents: string | Buffer;
  entryPoint?: string;
  /**
   * absolute file path
   */
  fileName: string;
  originalFileName?: string;
};

export type JsChunk = {
  type: 'chunk';
  contents: string;
  entryPoint?: string;
  /**
   * absolute file path
   */
  fileName: string;
  map?: SourceMap;
  modules?: Record<string, any>;
  originalFileName?: string;
};

export type Chunk = AssetChunk | JsChunk;
```

- Examples

```ts
compiler.hooks.renderChunk.tapPromise('minify', async chunk => {
  if (chunk.type === 'chunk') {
    const code = chunk.contents.toString();
    const result = await minify.call(compiler, code);
    return {
      ...chunk,
      contents: result.code,
      map: result.map,
    };
  }
  return chunk;
});
```

## dts

The [`buildConfig.dts`](/en/api/config/build-config#dts) configuration is mainly used for type file generation.

### Turn off type generation

Type generation is turned on by default, if you need to turn it off, you can configure it as follows:

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    dts: false,
  },
});
```

:::tip
The build speed is generally improved by closing the type file.
:::

### Build type files

With `buildType: 'bundleless'`, type files are generated using the project's `tsc` command to complete production.

The **Modern.js Module also supports bundling of type files**, although care needs to be taken when using this feature.

- Bundle type files does not enable type checking.
- Some third-party dependencies have incorrect syntax that can cause the bundling process to fail. So in this case, you need to exclude such third-party packages manually with [`buildConfig.externals`](/en/api/config/build-config#externals) or close [dts.respectExternal](/api/config/build-config#dtsrespectexternal) to external all third-party packages types.
- It is not possible to handle the case where the type file of a third-party dependency points to a `.ts` file. For example, the `package.json` of a third-party dependency contains something like this: `{"types": ". /src/index.ts"}`.

For the above problems, our recommended approach is to first use `tsc` to generate d.ts files, then package the index.d.ts as the entry and close `dts.respectExternal`. In the future evolution, we will gradually move towards this handling approach.

### Alias Conversion

During the bundleless build process, if an alias appears in the source code, e.g.

```js title="./src/index.ts"
import utils from '@common/utils';
```

The type files generated with `tsc` will also contain these aliases. However, Modern.js Module will convert the aliases in the type file generated by `tsc`.

### Some examples of the use of `dts`

General usage:

```js
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // The output path of the bundled type file at this point is `./dist/types`
  buildConfig: {
    buildType: 'bundle',
    dts: {
      tsconfigPath: './other-tsconfig.json',
      distPath: './types',
    },
    outDir: './dist',
  },
});
```

For the use of `dts.only`:

```js
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // At this moment the type file is not bundled and the output path is `./dist/types`
  buildConfig: [
    {
      buildType: 'bundle',
      dts: false,
      outDir: './dist',
    },
    {
      buildType: 'bundleless',
      dts: {
        only: true,
      },
      outDir: './dist/types',
    },
  ],
});
```

## Build process

When the `modern build` command is executed, the

- Clear the output directory according to `buildConfig.outDir`.
- Handle Copy tasks.
- Compile `js/ts` source code to generate the JS build artifacts for bundle/bundleless.
- Generate bundle/bundleless type files using `tsc`.

## Build errors

When a build error occurs, based on the information learned above, it is easy to understand what error appears in the terminal.

**Errors reported for js or ts builds:**

```bash
error  ModuleBuildError:

╭───────────────────────╮
│ bundle failed:        │
│  - format is "cjs"    │
│  - target is "esnext" │
╰───────────────────────╯

Detailed Information:
```

**Errors reported for the type file generation process:**

```bash
error   ModuleBuildError:

bundle DTS failed:
```

For `js/ts` build errors, we can tell from the error message.

- By `'bundle failed:'` to determine if the error is reported for a bundle build or a bundleless build
- What is the `format` of the build process
- What is the `target` of the build process
- The specific error message

## Debug mode

From **MAJOR_VERSION.36.0**, For troubleshooting purposes, the Modern.js Module provides a debug mode, which you can enable by adding the DEBUG=module environment variable when executing a build.

```bash
DEBUG=module modern build
```

In debug mode, you'll see more detailed build logs output in Shell, which are mainly process logs:

```bash
module run beforeBuildTask hooks +6ms
module run beforeBuildTask hooks done +0ms
module [DTS] Build Start +139ms
module [CJS] Build Start +1ms
```

In addition, Module provides the ability to debug internal workflows. You can enable more detailed debugging logging by setting the `DEBUG=module:*` environment variable.

Currently, only `DEBUG=module:resolve` is supported, which allows you to see a detailed log of module resolution within the Module.

```bash
  module:resolve onResolve args: {
  path: './src/hooks/misc.ts',
  importer: '',
  namespace: 'file',
  resolveDir: '/Users/bytedance/modern.js/packages/solutions/module-tools',
  kind: 'entry-point',
  pluginData: undefined
} +0ms
  module:resolve onResolve result: {
  path: '/Users/bytedance/modern.js/packages/solutions/module-tools/src/hooks/misc.ts',
  external: false,
  namespace: 'file',
  sideEffects: undefined,
  suffix: ''
} +0ms
```
