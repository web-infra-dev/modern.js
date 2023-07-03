---
sidebar_position: 1
---

# buildConfig

`buildConfig` is a configuration option that describes how to compile and generate build artifacts. It contains all the configurations related to the build process.

- **Type**: `object | object[]`
- **Default**: `undefined`

:::tip
Before start using `buildConfig`, please read the following documentation to understand its purpose:

- [Modifying Output Artifacts](/guide/basic/modify-output-product.html)
- [In-Depth Understanding of the Build Process](/guide/advance/in-depth-about-build.html)

:::

## alias

- **Type**: `Record<string, string> | Function`
- **Default**: `{'@': 'src',}`

:::tip
For TypeScript projects, you only need to configure [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) in `tsconfig.json`, Module Tools will automatically recognize the alias in `tsconfig.json`, so there is no need to configure the `alias` field additionally.
:::

```js modern.config.ts
export default {
  buildConfig: {
    alias: {
      '@common': '. /src/common',
    },
  },
};
```

After the above configuration is done, if `@common/Foo.tsx` is referenced in the code, it will map to the `<root>/src/common/Foo.tsx` path.

When the value of `alias` is defined as a function, you can accept the pre-defined alias object and modify it.

```js modern.config.ts
export default {
  buildConfig: {
    alias: alias => {
      alias['@common'] = '. /src/common';
    },
  },
};
```

It is also possible to return a new object as the final result in the function, which will override the pre-defined alias object.

```js modern.config.ts
export default {
  buildConfig: {
    alias: alias => {
      return {
        '@common': '. /src/common',
      };
    },
  },
};
```

## asset

Contains configuration related to static assets.

## asset.path

Static resource output path, will be based on [outDir](/api/config/build-config#outDir)

- **Type**: `string`
- **Default**: `assets`

## asset.limit

Used to set the threshold for static assets to be automatically inlined as base64.

By default, Module Tools will inline assets such as images, fonts and media smaller than 10KB during bundling. They are Base64 encoded and inlined in the bundles, eliminating the need for separate HTTP requests.

You can adjust this threshold by modifying the `limit` config.

- **Type**: `number`
- **Default**: `10 * 1024`

For example, set `limit` to `0` to avoid assets inlining:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    asset: {
      limit: 0,
    },
  },
});
```

## asset.publicPath

The CDN prefix given to unlinked resources when packaging

- **Type**: `string`
- **Default**: `undefined`

```js modern.config.ts
export default {
  buildConfig: {
    asset: {
      publicPath: 'https://xxx/',
    },
  },
};
```

At this point, all static resources will be prefixed with `https://xxx/`

## asset.svgr

Packaged to handle svg as a React component, options reference [svgr](https://react-svgr.com/docs/options/), plus support for two configuration options `include` and `exclude` to match the svg file to be handled

- **Type**: `boolean | object`
- **Default**: `false`

When svgr feature is enabled, you can use svg as a component using the default export.

```js index.ts
// true
import Logo from './logo.svg';

export default () => <Logo />;
```

:::warning
The following usage is not currently supported:

```js index.ts
import { ReactComponent } from './logo.svg';
```

:::

When enabled, the type of svg used can be modified by adding a type definition to the `modern-app-env.d.ts` file:

```ts modern-app-env.d.ts focus=1:3
declare module '*.svg' {
  const src: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default src;
}

/// <reference types='@modern-js/module-tools/types' />
```

## asset.svgr.include

Set the matching svg file

- **Type**: `string | RegExp | (string | RegExp)[]`
- **Default**: `/\.svg$/`

## asset.svgr.exclude

Set unmatched svg files

- **Type**: `string | RegExp | (string | RegExp)[]`
- **Default**: `undefined`

## autoExternal

Automatically externalize project dependencies and peerDependencies and not package them into the final bundle

- **Type**: `boolean | object`
- **Default**: `true`

When we want to turn off the default handling behavior for third-party dependencies, we can do so by:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    autoExternal: false,
  },
});
```

This way the dependencies under `"dependencies"` and `"peerDependencies"` will be bundled. If you want to turn off the processing of only one of these dependencies, you can use the
`buildConfig.autoExternal` in the form of an object.

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    autoExternal: {
      dependencies: false,
      peerDependencies: false,
    },
  },
});
```

## autoExternal.dependencies

Whether or not the dep dependencies of the external project are needed

- **Type**: `boolean`
- **Default**: `true`

## autoExternal.peerDependencies

Whether to require peerDep dependencies for external projects

- **Type**: `boolean`
- **Default**: `true`

## buildType

The build type, `bundle` will package your code, `bundleless` will only do the code conversion

- **Type**: `'bundle' | 'bundleless'`
- **Default**: `bundle`

## copy

Copies the specified file or directory into the build output directory

- **Type**: `object[]`
- **Default**: `[]`

```js
export default {
  buildConfig: {
    copy: [{ from: '. /src/assets', to: '' }],
  },
};
```

Reference for array settings: [copy-webpack-plugin patterns](https://github.com/webpack-contrib/copy-webpack-plugin#patterns)

## copy.patterns

- **Type**: `CopyPattern[]`
- **Default**: `[]`

```ts
interface CopyPattern {
  from: string;
  to?: string;
  context?: string;
  globOptions?: globby.GlobbyOptions;
}
```

## copy.options

- **Type**:

```ts
type Options = {
  concurrency?: number;
  enableCopySync?: boolean;
};
```

- **Default**: `{ concurrency: 100, enableCopySync: false }`

- `concurrency`: Specifies how many copy tasks to execute in parallel.
- `enableCopySync`: Uses [`fs.copySync`](https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/copy-sync.js) by default, instead of [`fs.copy`](https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/copy.js).

## define

Define global variables that will be injected into the code

- **Type**: `Record<string, string>`
- **Default**: `{}`

Since the `define` function is implemented by global text replacement, you need to ensure that the global variable values are strings. A safer approach is to convert the value of each global variable to a string, using `JSON.stringify`, as follows.

```js modern.config.ts
export default {
  buildConfig: {
    define: {
      VERSION: JSON.stringify('1.0'),
    },
  },
};
```

:::tip
To prevent excessive global replacement substitution, it is recommended that the following two principles be followed when using

- Use upper case for global constants
- Customize the prefix and suffix of global constants to ensure uniqueness

:::

<!-- ## disableSwcTransform

Starting with version 2.16.0, SWC Transform is enabled by default for code transformation. If you want to disable this feature, you can use this configuration. Only esbuild Transform is used in this case.

The use of SWC Transform can reduce the impact of auxiliary functions on the volume of the constructed product.

* **Type**: `boolean`
* **Default**: `false` -->

## dts

The dts file generates the relevant configuration, by default it generates.

- **Type**: `false | object`
- **Default**:

```js
{
  abortOnError: true,
  distPath: './',
  only: false,
  tsconfigPath: './tsconfig.json',
}
```

## dts.abortOnError

Whether to allow the build to succeed if a type error occurs.

- **Type**: `boolean`
- **Default**: `true`

**By default, type errors will cause the build to fail**. When `abortOnError` is set to `false`, the build will still succeed even if there are type issues in the code:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    dts: {
      abortOnError: false,
    },
  },
});
```

:::warning
When this configuration is disabled, there is no guarantee that the type files will be generated correctly. In `buildType: 'bundle'`, which is the bundle mode, type files will not be generated.
:::

## dts.distPath

The output path of the dts file, based on [outDir](/api/config/build-config#outDir)

- **Type**: `string`
- **Default**: `. /types`

## dts.only

Generate only dts files, not js files

- **Type**: `boolean`
- **Default**: `false`

## dts.respectExternal

When set to `false`, the type of third-party packages will be excluded from the bundle, when set to `true`, it will determine whether third-party types need to be bundled based on [externals](#externals).

When bundle d.ts, export is not analyzed, so any third-party package type you use may break your build, which is obviously uncontrollable.
So we can avoid it with this configuration.

- **Type**: `boolean`
- **Default**: `true`

## dts.tsconfigPath

Path to the tsconfig file

- **Type**: `string`
- **Default**: `. /tsconfig.json`

## esbuildOptions

Directly modify [esbuild configuration](https://esbuild.github.io/api/)

- **Type**: `Function`
- **Default**: `c => c`

For example, if we need to modify the file extension of the generated files:

```ts modern.config.ts
export default defineConfig({
  buildConfig: {
    esbuildOptions: options => {
      options.outExtension = { '.js': '.mjs' };
      return options;
    },
  },
});
```

:::tip
We have done many extensions based on the original esbuild build. Therefore, when using this configuration, pay attention to the following:

1. Prefer to use the configuration we provide. For example, esbuild does not support target: 'es5', but we support this scenario internally using swc. Setting target: 'es5' through esbuildOptions will result in an error.
2. Currently, we use enhanced-resolve internally to replace esbuild's resolve algorithm, so modifying esbuild resolve-related configurations is invalid. We plan to switch back in the future.
3. When using esbuild plugins, you need to add the plugins to the beginning of the plugins array because we also intervene in the entire build process through an esbuild plugin internally. Therefore, custom plugins need to be registered first.

:::

## externalHelpers

By default, the output JS code may depend on helper functions to support the target environment or output format, and these helper functions will be inlined in the file that requires it.

When using SWC Transform for code transformation, you can enable the `externalHelpers` configuration to convert inline helper functions to import them from the external module `@swc/helpers`.

- **Type**: `boolean`
- **Default**: `false`

Below is a comparison of the output file changes before and after using this configuration.

Before enable:

```js ./dist/index.js
// helper function
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  // ...
}
// helper function
function _async_to_generator(fn) {
  return function () {
    // use asyncGeneratorStep
    // ...
  };
}

// your code
export var yourCode = function () {
  // use _async_to_generator
};
```

After enabled:

```js ./dist/index.js
// helper functions imported from @swc/helpers
import { _ as _async_to_generator } from '@swc/helpers/_/_async_to_generator';

// your code
export var yourCode = function () {
  // use _async_to_generator
};
```

## externals

Configure external dependencies that will not be bundled into the final bundle.

- **Type**:

```ts
type External = (string | RegExp)[];
```

- **Default**: `[]`
- **Build Type**: `Only supported for buildType: 'bundle'`
- **Example**:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    // do not bundle React
    externals: ['react'],
  },
});
```

## format

Used to set the output format of JavaScript files. The options `iife` and `umd` only take effect when `buildType` is `bundle`.

- **Type**: `'esm' | 'cjs' | 'iife' | 'umd'`
- **Default**: `cjs`

### format: 'esm'

`esm` stands for "ECMAScript module" and requires the runtime environment to support import and export syntax.

- **Example**:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    format: 'esm',
  },
});
```

### format: 'cjs'

`cjs` stands for "CommonJS" and requires the runtime environment to support exports, require, and module syntax. This format is commonly used in Node.js environments.

- **Example**:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    format: 'cjs',
  },
});
```

### format: 'iife'

`iife` stands for "immediately-invoked function expression" and wraps the code in a function expression to ensure that any variables in the code do not accidentally conflict with variables in the global scope. This format is commonly used in browser environments.

- **Example**:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    format: 'iife',
  },
});
```

### format: 'umd'

`umd` stands for "Universal Module Definition" and is used to run modules in different environments such as browsers and Node.js. Modules in UMD format can be used in various environments, either as global variables or loaded as modules using module loaders like RequireJS.

- **Example**:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    format: 'umd',
  },
});
```

## input

Specify the entry file for the build, in the form of an array that can specify the directory

- **Type**:

```ts
type Input =
  | string[];
  | {
      [name: string]: string;
    }
```

- **Default**: `['src/index.ts']` in `bundle` mode, `['src']` in `bundleless` mode

**Array usage:**

```js modern.config.ts
export default {
  buildConfig: {
    input: ['src/index.ts', 'src/index2.ts'],
  },
};
```

**Object usage:**

When you need to modify the output file name in bundle mode, you can use an object configuration.

**The key of the object is the file name of the output, and the value is the file path of the source code.**

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    format: 'esm',
    input: {
      'index.esm': './src/index.ts',
    },
  },
});
```

## jsx

Specify the compilation method for JSX, which by default supports React 17 and higher versions and automatically injects JSX runtime code.

- **Type**: `automatic | transform`
- **Default**: `automatic`

If you need to support React 16, you can set `jsx` to `transform`:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    jsx: 'transform',
  },
});
```

:::tip
For more information about JSX Transform, you can refer to the following links:

- [React Blog - Introducing the New JSX Transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html).
- [esbuild - JSX](https://esbuild.github.io/api/#jsx).
  :::

## metafile

This option is used for build analysis. When enabled, esbuild will generate metadata about the build in JSON format.

- **Type**: `boolean`
- **Default**: `false`
- **Build Type**: `Only supported for buildType: 'bundle'`

To enable `metafile` generation:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    metafile: true,
  },
});
```

After executing the build, a `metafile-[xxx].json` file will be generated in the output directory. You can use tools like [esbuild analyze](https://esbuild.github.io/analyze/) and [bundle-buddy](https://bundle-buddy.com/esbuild) for visual analysis.

## minify

Use esbuild or terser to compress code, also pass [terserOptions](https://github.com/terser/terser#minify-options)

- **Type**: `'terser' | 'esbuild' | false | object`
- **Default**: `false`

```js modern.config.ts
export default {
  buildConfig: {
    minify: {
      compress: {
        drop_console: true,
      },
    },
  },
};
```

## outDir

Specifies the output directory of the build

- **Type**: `string`
- **Default**: `dist`

## platform

Generates code for the node environment by default, you can also specify `browser` which will generate code for the browser environment

- **Type**: `'browser' | 'node'`
- **Default**: `node`

## redirect

In `buildType: 'bundleless'` build mode, the reference path is redirected to ensure that it points to the correct product, e.g:

- `import '. /index.less'` will be rewritten to `import '. /index.css'`
- `import icon from '. /close.svg'` would be rewritten as `import icon from '... /asset/close.svg'` to `import icon from '. /asset/close.svg'` (depending on the situation)

In some scenarios, you may not need these functions, then you can turn it off with this configuration, and its reference path will not be changed after turning it off.

```js modern.config.ts
export default {
  buildConfig: {
    redirect: {
      alias: false, // Turn off modifying alias paths
      style: false, // Turn off modifying the path to the style file
      asset: false, // Turn off modifying the path to the resource file
    },
  },
};
```

## sideEffects

Module sideEffects

- **Type**: `RegExg[] | (filePath: string, isExternal: boolean) => boolean | boolean`
- **Default**: `undefined`

Normally, we configure the module's side effects via the sideEffects field in package.json, but in some cases, The package.json of a third-party package is unreliable.Such as when we reference a third-party package style file

```js
import 'other-package/dist/index.css';
```

But the package.json of this third-party package does not have the style file configured in the sideEffects

```json other-package/package.json
{
  "sideEffects": ["dist/index.js"]
}
```

At the same time you set [style.inject](#styleinject) to `true` and you will see a warning message like this in the console

```bash
[LIBUILD:ESBUILD_WARN] Ignoring this import because "other-package/dist/index.css" was marked as having no side effects
```

At this point, you can use this configuration option to manually configure the module's `"sideEffects"` to support regular and functional forms.

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    sideEffects: [/\.css$/],
    // or
    // sideEffects: (filePath, isExternal) => /\.css$/.test(filePath),
  },
});
```

:::tip
After adding this configuration, the sideEffects field in package.json will no longer be read when packaging
:::

## sourceDir

Specify the source directory of the build, default is `src`, which is used to generate the corresponding output directory based on the source directory structure when building `bundleless`.

- **Type**: `string`
- **Default**: `src`

## sourceMap

Whether to generate sourceMap or not

- **Type**: `boolean | 'inline' | 'external'`
- **Default**: `false`

## sourceType

Sets the format of the source code. By default, the source code will be treated as EsModule. When the source code is using CommonJS, you need to set `commonjs`.

- **Type**: `'commonjs' | 'module'`
- **Default**: `'module'`

## splitting

Whether to enable code splitting

- **Type**: `boolean`
- **Default**: `false`

## style

Configure style-related configuration

## style.less

less-related configuration

## style.less.lessOptions

Refer to [less](https://less.bootcss.com/usage/#less-options) for detailed configuration

- **Type**: `object`
- **Default**: `{ javascriptEnabled: true }`

## style.less.additionalData

Add `Less` code to the beginning of the entry file.

- **Type**: `string`
- **Default**: `undefined`

```js modern.config.ts
export default {
  buildConfig: {
    style: {
      less: {
        additionalData: `@base-color: #c6538c;`,
      },
    },
  },
};
```

## style.less.implementation

Configure the implementation library used by `Less`, if not specified, the built-in version used is `4.1.3`.

- **Type**: `string | object`
- **Default**: `undefined`

Specify the implementation library for `Less` when the `object` type is specified.

```js modern.config.ts
export default {
  buildConfig: {
    style: {
      less: {
        implementation: require('less'),
      },
    },
  },
};
```

For the `string` type, specify the path to the implementation library for `Less`

```js modern.config.ts
export default {
  buildConfig: {
    style: {
      less: {
        implementation: require.resolve('less'),
      },
    },
  },
};
```

## style.sass

sass-related configuration.

## style.sass.sassOptions

Refer to [node-sass](https://github.com/sass/node-sass#options) for detailed configuration.

- **Type**: `object`
- **Default**: `{}`

## style.sass.additionalData

Add `Sass` code to the beginning of the entry file.

- **Type**: `string | Function`
- **Default**: `undefined`

```js modern.config.ts
export default {
  buildConfig: {
    style: {
      sass: {
        additionalData: `$base-color: #c6538c;
          $border-dark: rgba($base-color, 0.88);`,
      },
    },
  },
};
```

## style.sass.implementation

Configure the implementation library used by `Sass`, the built-in version used is `1.5.4` if not specified.

- **Type**: `string | object`
- **Default**: `undefined`

Specify the implementation library for `Sass` when the `object` type is specified.

```js modern.config.ts
export default {
  buildConfig: {
    style: {
      sass: {
        implementation: require('sass'),
      },
    },
  },
};
```

For the `string` type, specify the path to the `Sass` implementation library

```js modern.config.ts
export default {
  buildConfig: {
    style: {
      sass: {
        implementation: require.resolve('sass'),
      },
    },
  },
};
```

## style.postcss

- plugins
- processOptions

See [PostCSS](https://github.com/postcss/postcss#options) for detailed configuration

**Basic usage：**

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    style: {
      postcss: {
        plugins: [yourPostCSSPlugin],
      },
    },
  },
});
```

## style.inject

Configure whether to insert CSS styles into JavaScript code in bundle mode.

- **Type**: `boolean`
- **Default**: `false`

Set `inject` to `true` to enable this feature:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    inject: true,
  },
});
```

Once enabled, you will see the CSS code referenced in the source code included in the bundled JavaScript output.

For example, if you write `import './index.scss'` in the source code, you will see the following code in the output:

```js dist/index.js
// node_modules/style-inject/dist/style-inject.es.js
function styleInject(css, ref) {
  // ...
}
var style_inject_es_default = styleInject;

// src/index.scss
var css_248z = '.body {\n color: black;\n}';
style_inject_es_default(css_248z);
```

:::tip

After enabling `inject`, you need to pay attention to the following points:

- `@import` in CSS files will not be processed. If your CSS file contains `@import`, you need to manually import the CSS file in the JS file (less and scss files are not required because they have preprocessing).
- Consider the impact of `sideEffects`. By default, our builder assumes that CSS has side effects. If the `sideEffects` field is set in your project or third-party package's package.json and does not include this CSS file, you will receive a warning:

```shell
[LIBUILD:ESBUILD_WARN] Ignoring this import because "src/index.scss" was marked as having no side effects by plugin "libuild:adapter"
```

You can resolve this by configuring [sideEffects](#sideeffects).

## style.autoModules

Enable CSS Modules automatically based on the filename.

- **Type**: `boolean | RegExp`
- **Default**: `true`

`true` : Enables CSS Modules for style files ending with `.module.css` `.module.less` `.module.scss` `.module.sass` filenames

`false` : Disable CSS Modules.

`RegExp` : Enables CSS Modules for all files that match the regular condition.

## style.modules

CSS Modules configuration

- **Type**: `object`
- **Default**: `{}`

A common configuration is `localsConvention`, which changes the class name generation rules for css modules

```js modern.config.ts
export default {
  buildConfig: {
    style: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  },
};
```

For the following styles

```css
.box-title {
  color: red;
}
```

You can use `styles.boxTitle` to access

For detailed configuration see [postcss-modules](https://github.com/madyankin/postcss-modules#usage)

## style.tailwindcss

tailwindcss related configuration

- **Type**: `object | Function`
- **Default**: `see configuration details below`

<details>
  <summary>Tailwind CSS configuration details</summary>

```js modern.config.ts
const tailwind = {
  content: [
    './config/html/**/*.html',
    './config/html/**/*.ejs',
    './config/html/**/*.hbs',
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.ts',
    './src/**/*.tsx',
    './storybook/**/*',
  ],
};
```

When the value is of type `object`, it is merged with the default configuration via `Object.assign`.

When the value is of type `Function`, the object returned by the function is merged with the default configuration via `Object.assign`.

The `theme` property is not allowed, otherwise the build will fail, using [`designSystem`](/api/config/design-system) as the `Tailwind CSS Theme` configuration.

The rest of the usage is the same as Tailwind CSS: [Quick Portal](https://tailwindcss.com/docs/configuration).

## target

`target` is used to set the target environment for the generated JavaScript code. It enables Module Tools to transform JavaScript syntax that is not recognized by the target environment into older versions of JavaScript syntax that are compatible with these environments.

- **Type**:

```ts
type Target =
  | 'es5'
  | 'es6'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'es2021'
  | 'es2022'
  | 'esnext';
```

- **Default**: `'es6'`

For example, compile the code to `es5` syntax:

```js modern.config.ts
export default defineConfig({
  buildConfig: {
    target: 'es5',
  },
});
```

## transformImport

Using [SWC](https://swc.rs/) provides the same ability and configuration as [`babel-plugin-import`](https://github.com/umijs/babel-plugin-import).

- **Type**: `object[]`
- **Default**: `[]`

The elements of the array are configuration objects for `babel-plugin-import`, which can be referred to [options](https://github.com/umijs/babel-plugin-import#options)。

**Example:**

```ts modern.config.ts
export default defineConfig({
  buildConfig: {
    transformImport: [
      // babel-plugin-import`s options config
      {
        libraryName: 'foo',
        style: true,
      },
    ],
  },
});
```

### Notes

Reference the [Import Plugin - Notes](plugins/official-list/plugin-import.html#Notes)

## umdGlobals

Specify global variables for external import of umd artifacts

- **Type**: `Record<string, string>`
- **Default**: `{}`

```js modern.config.ts
export default {
  buildConfig: {
    umdGlobals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
};
```

At this point, `react` and `react-dom` will be seen as global variables imported externally and will not be packed into the umd product, but will be accessible by way of `global.React` and `global.ReactDOM`

## umdModuleName

Specifies the module name of the umd product

- **Type**: `string | Function`
- **Default**: `name => name`

```js
export default {
  buildConfig: {
    format: 'umd',
    umdModuleName: 'myLib',
  },
};
```

At this point the umd artifact will go to mount on `global.myLib`

:::tip

- The module name of the umd artifact must not conflict with the global variable name.
- Module names will be converted to camelCase, e.g. `my-lib` will be converted to `myLib`, refer to [toIdentifier](https://github.com/babel/babel/blob/main/packages/babel-types/src/converters/toIdentifier.ts).

:::

Also the function form can take one parameter, which is the output path of the current package file

```js modern.config.ts
export default {
  buildConfig: {
    format: 'umd',
    umdModuleName: path => {
      if (path.includes('index')) {
        return 'myLib';
      } else {
        return 'myLib2';
      }
    },
  },
};
```
