---
sidebar_position: 1
---

# In-depth understanding of build

In the [Basic Usage] section, we already knew that you can modify the output product of a project through the `buildConfig` configuration. `buildConfig` not only describes some of the features of the product, but also provides some functionality for building the product.

:::tip{title=notes}
If you are not sure what `buildConfig` is, it is recommended to take some time to understand it by following this link.

- [[modify-output-product](/en/guide/basic/modify-output-product)]

:::

In this chapter we'll dive into the use of certain build configurations and understand what happens when the `modern build` command is executed.

## In-depth understanding of `buildConfig`

### Bundle and Bundleless

So first let's understand Bundle and Bundleless.

A Bundle is a package of build products, which may be a single file or multiple files based on a certain [code splitting strategy](https://esbuild.github.io/api/#splitting).

Bundleless, on the other hand, means that each source file is compiled and built separately, but not packaged together. Each product file can be found with its corresponding source code file. The process of **Bundleless build can also be understood as the process of code conversion of source files only**.

In `buildConfig` you can specify whether the current build task is Bundle or Bundleless by using [`buildConfig.buildType`](/en/api/config/build-config#buildtype).

### Relationship between `input` and `sourceDir`

[`buildConfig.input`](/en/api/config/build-config#input) is used to specify the file path or directory path where the source code is read, and its default value differs between Bundle and Bundleless builds.

- When `buildType: 'bundle'`, `input` defaults to `['src/index.ts']`
- When `buildType: 'bundleless'`, `input` defaults to `['src']`
  > In fact, at `buildType: 'bundle'`, the build tool detects the existence of a file matching the name rule `src/index.(j|t)sx?` and uses it as an entry file.

:::warning{title=notes}
It is recommended that you do not specify multiple source file directories during a Bundleless build, as unintended results may occur. Bundleless builds with multiple source directories are currently in an unstable stage.
:::

We know from the defaults: **Bundle builds can generally specify a file path as the entry point to the build, while Bundleless builds are more expected to use directory paths to find source files**.

#### Object type of `input`

In addition to setting `input` to an array, you can also set it to an object during the Bundle build process. **By using the object form, we can modify the name of the file that the build product outputs**. So for the following example, `. /src/index.ts` corresponds to the path of the build product file as `. /dist/main.js`.

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    input: {
      main: ['./src/index.ts'],
    },
    outDir: './dist',
  },
});
```

The Bundleless build process also supports such use, but it is not recommended.

#### `sourceDir`

[`sourceDir`](/en/api/config/build-config#sourcedir) is used to specify the source code directory, which is related to both.

- type file generation
- [`outbase`](https://esbuild.github.io/api/#outbase) for specifying the build process

In general:

- **During the Bundleless build process, the values of `sourceDir` and `input` should be the same, and their default values are both `src`**.
- It is rarely necessary to use `sourceDir` during the Bundle build process.

### Declaration Type Files

The [`buildConfig.dts`](/en/api/config/build-config#dts) configuration is mainly used for type file generation.

#### Turn off type generation

Type generation is turned on by default, if you need to turn it off, you can configure it as follows:

```js modern.config.ts
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

#### Build type files

With `buildType: 'bundleless'`, type files are generated using the project's `tsc` command to complete production.

The **module engineering solution also supports packaging of type files**, although care needs to be taken when using this feature.

- Some third-party dependencies have incorrect syntax that can cause the packaging process to fail. So in this case, you need to exclude such third-party packages manually with [`buildConfig.externals`](/en/api/config/build-config#externals).
- It is not possible to handle the case where the type file of a third-party dependency points to a `.ts` file. For example, the `package.json` of a third-party dependency contains something like this: `{"types": ". /src/index.ts"}`.

#### Alias Conversion

During the Bundleless build process, if an alias appears in the source code, e.g.

```js ./src/index.ts
import utils from '@common/utils';
```

Normally, product type files generated with `tsc` will also contain these aliases. However, Module Tools will convert the aliases in the type file generated by `tsc` to:

- Alias conversion is possible for code of the form `import '@common/utils'` or `import utils from '@common/utils'`.
- Aliasing is possible for code of the form `export { utils } from '@common/utils'`.

However, there are some cases that cannot be handled at this time.

- Output types of the form `Promise<import('@common/utils')>` cannot be converted at this time.

#### Some examples of the use of `dts`

General usage:

```js
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  // The output path of the packaged type file at this point is `./dist/types`
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
  // At this moment the type file is not packaged and the output path is `./dist/types`
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

### `buildConfig.define` Usage for different scenarios

[`buildConfig.define`](/en/api/config/build-config#define) functions somewhat similar to [`webpack.DefinePlugin`](https://webpack.js.org/plugins/define-plugin/). A few usage scenarios are described here.

#### Environment variable replacement

```js
import { defineConfig } from '@modern-js/module-tools';
export default defineConfig({
  buildConfig: {
    define: {
      'process.env.VERSION': JSON.stringify(process.env.VERSION || '0.0.0'),
    },
  },
});
```

With the above configuration, we can put the following code.

```js
// pre-compiler code
console.log(process.env.VERSION);
```

When executing `VERSION=1.0.0 modern build`, the conversion is:

```js
// compiled code
console.log('1.0.0');
```

#### Global variable replacement

```js
import { defineConfig } from '@modern-js/module-tools';
export default defineConfig({
  buildConfig: {
    define: {
      VERSION: JSON.stringify(require('. /package.json').version || '0.0.0'),
    },
  },
});
```

With the above configuration, we can put the following code.

```js
// pre-compile code
console.log(VERSION);
```

Convert to:

```js
// post-compile code
console.log('1.0.0');
```

Note, however: If the project is a TypeScript project, then you may need to add the following to the `.d.ts` file in the project source directory.

> If the `.d.ts` file does not exist, then you can create it manually.

```ts env.d.ts
declare const YOUR_ADD_GLOBAL_VAR;
```

## Build process

When the `modern build` command is executed, the

- Clear the products directory according to `buildConfig.outDir`.
- Compile `js/ts` source code to generate the JS build product for Bundle/Bundleless.
- Generate Bundle/Bundleless type files using `tsc`.
- Handle Copy tasks.

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

- By `'bundle failed:'` to determine if the error is reported for a Bundle build or a Bundleless build?
- What is the `format` of the build process?
- What is the `target` of the build process?
- The specific error message.
