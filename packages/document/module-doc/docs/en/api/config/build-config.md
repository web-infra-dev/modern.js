---
sidebar_position: 1
---

# BuildConfig

This section describes all the configuration of Module Tools for building

## alias

- type: `Record<string, string> | Function`
- default: `{'@': 'src',}`

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

### path

Static resource output path, will be based on [outDir](/api/config/build-config#outDir)

- type: `string`
- default: `assets`

### limit

Threshold for automatically inlining static resources when building, resources less than 10 KB will be automatically inlined into the bundle product

- type: `number`
- default: `10 * 1024`

### publicPath

The CDN prefix given to unlinked resources when packaging

- type: `string`
- default: `undefined`

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

### svgr

Packaged to handle svg as a React component, options reference [svgr](https://react-svgr.com/docs/options/), plus support for two configuration items `include` and `exclude` to match the svg file to be handled

- type: `boolean | Object`
- default: `false`

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

#### include

Set the matching svg file

- type: `string | RegExp | (string | RegExp)[]`
- default: `/\.svg$/`

#### exclude

Set unmatched svg files

- type: `string | RegExp | (string | RegExp)[]`
- default: `undefined`

## autoExternal

Automatically externalize project dependencies and peerDependencies and not package them into the final bundle

- type: `boolean | Object`
- default: `true`

When we want to turn off the default handling behavior for third-party dependencies, we can do so by:

```ts
export default defineConfig({
  buildConfig: {
    autoExternal: false,
  },
});
```

This way the dependencies under `"dependencies"` and `"peerDependencies"` will be packaged. If you want to turn off the processing of only one of these dependencies, you can use the
`buildConfig.autoExternal` in the form of an object.

```ts
export default defineConfig({
  buildConfig: {
    autoExternal: {
      dependencies: false,
      peerDependencies: false,
    },
  },
});
```

### dependencies

Whether or not the dep dependencies of the external project are needed

- type: `boolean`
- default: `true`

### peerDependencies

Whether to require peerDep dependencies for external projects

- type: `boolean`
- default: `true`

## buildType

The build type, `bundle` will package your code, `bundleless` will only do the code conversion

- type: `'bundle' | 'bundleless'`
- default: `bundle`

## copy

Copies the specified file or directory into the build output directory

- type: `Array`
- default: `[]`

```js
export default {
  buildConfig: {
    copy: [{ from: '. /src/assets', to: '' }],
  },
};
```

Reference for array settings: [copy-webpack-plugin patterns](https://github.com/webpack-contrib/copy-webpack-plugin#patterns)

## define

Define global variables that will be injected into the code

- type: `Record<string, string>`
- default: `{}`

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

- type: `false | Object`
- default:

```js
{
  abortOnError: true,
  distPath: './',
  only: false,
  tsconfigPath: './tsconfig.json',
}
```

### abortOnError

Whether to allow the build to succeed in case of a type error. By default, this will cause the build to fail in case of a type error.

:::warning
When this configuration is turned on, there is no guarantee that the type files will be generated properly and accurately. In `buildType: 'bundle'` or Bundle build mode, the type file must not be generated.
:::

- type: `boolean`
- default: `true`

### distPath

The output path of the dts file, based on [outDir](/api/config/build-config#outDir)

- type: `string`
- default: `. /types`

### only

Generate only dts files, not js files

- type: `boolean`
- default: `false`

### tsconfigPath

Path to the tsconfig file

- type: `string`
- default: `. /tsconfig.json`

## esbuildOptions

Directly modify [esbuild configuration](https://esbuild.github.io/api/)

- Type: `Function`
- Default: `c => c`

For example, if we need to modify the file extension of the generated files:

```ts modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

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

<!-- ## externalHelpers

By default, the output JS code may depend on helper functions to support the target environment or output format, and these helper functions will be inlined in the file that requires it.

When using SWC Transform for code transformation, you can enable the `externalHelpers` configuration to convert inline helper functions to import them from the external module `@swc/helpers`.

* **Type**: `boolean`
* **Default**: `false`

Below is a comparison of the product changes before and after using this configuration.

Before enable:

``` js ./dist/index.js
// helper function
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  // ...
}
// helper function
function _async_to_generator(fn) {
  return function() {
    // use asyncGeneratorStep
    // ...
  };
}

// your code
export var yourCode = function() {
  // use _async_to_generator
}
```

After enabled:

``` js ./dist/index.js
// helper functions imported from @swc/helpers
import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";

// your code
export var yourCode = function() {
  // use _async_to_generator
}
``` -->

## externals

Configure external dependencies that will not be packaged into the final bundle

- type: `(string | RegExp)[]`
- default: `[]`

## format

The format of the js product output, where `iife` and `umd` can only take effect when `buildType` is `bundle`

- type: `'esm' | 'cjs' | 'iife' | 'umd'`
- default: `cjs`

## input

Specify the entry file for the build, in the form of an array that can specify the directory

- type: `string[] | Record<string, string>`
- default: `['src/index.ts']` in `bundle` mode, `['src']` in `bundleless` mode

```js modern.config.ts
export default {
  buildConfig: {
    input: ['src/index.ts', 'src/index2.ts'],
  },
};
```

## jsx

Specify the compilation method of jsx, default support React17, automatically inject jsx runtime code

- type: `automatic | classic`
- default: `automatic`

## metafile

esbuild to produce some metadata about the build in JSON format, which can be visualized by tools such as [bundle-buddy](https://bundle-buddy.com/esbuild)

- type: `boolean`
- default: `false`

## minify

Use esbuild or terser to compress code, also pass [terserOptions](https://github.com/terser/terser#minify-options)

- type: `'terser' | 'esbuild' | false | Object`
- default: `false`

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

- type: `string`
- default: `dist`

## platform

Generates code for the node environment by default, you can also specify `browser` which will generate code for the browser environment

- type: `'browser' | 'node'`
- default: `node`

## redirect

In `buildType: 'bundleless'` build mode, the reference path is redirected to ensure that it points to the correct product, e.g:

- `import '. /index.less'` will be rewritten to `import '. /index.css'`
- `import icon from '. /close.svg'` would be rewritten as `import icon from '... /asset/close.svg'` to `import icon from '. /asset/close.svg'` (depending on the situation)

In some scenarios, you may not need these functions, then you can turn it off with this configuration, and its reference path will not be changed after turning it off.

```ts
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

- Type: `RegExg[] | (filePath: string, isExternal: boolean) => boolean | boolean`
- Default value: `undefined`

Normally, we configure the module's side effects via the sideEffects field in package.json, but in some cases, The package.json of a three-party package is unreliable.Such as when we reference a three-party package style file

```js
import 'other-package/dist/index.css';
```

But the package.json of this three-party package does not have the style file configured in the sideEffects

```json other-package/package.json
{
  "sideEffects": ["dist/index.js"]
}
```

At the same time you set [style.object](#inject) to `true` and you will see a warning message like this in the console

```bash
[LIBUILD:ESBUILD_WARN] Ignoring this import because "other-package/dist/index.css" was marked as having no side effects
```

At this point, you can use this configuration item to manually configure the module's `"sideEffects"` to support regular and functional forms.

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';
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

Specify the source directory of the build, default is `src`, which is used to generate the corresponding product directory based on the source directory structure when building `bundleless`.

- type: `string`
- default: `src`

## sourceMap

Whether to generate sourceMap or not

- type: `boolean | 'inline' | 'external'`
- default: `false`

<!-- ## sourceType

Sets the format of the source code. By default, the source code will be treated as EsModule. When the source code is using CommonJS, you need to set `commonjs`.

- **Type**: `commonjs` | `module`
- **Default**: `module` -->

## splitting

Whether to enable code splitting

- type: `boolean`
- default: `false`

## style

Configure style-related configuration

### less

less-related configuration

#### lessOptions

Refer to [less](https://less.bootcss.com/usage/#less-options) for detailed configuration

- type: `Object`
- default: `{ javascriptEnabled: true }`

#### additionalData

Add `Less` code to the beginning of the entry file.

- type: `string`
- default: `undefined`

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

#### implementation

Configure the implementation library used by `Less`, if not specified, the built-in version used is `4.1.3`

- type: `string | Object`
- default: `undefined`

Specify the implementation library for `Less` when the `Object` type is specified

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

### sass

sass-related configuration

#### sassOptions

Refer to [node-sass](https://github.com/sass/node-sass#options) for detailed configuration

- type: `Object`
- default: `{}`

#### additionalData

Add `Sass` code to the beginning of the entry file.

- type: `string | Function`
- default: `undefined`

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

#### implementation

Configure the implementation library used by `Sass`, the built-in version used is `1.5.4` if not specified

- type: `string | Object`
- default: `undefined`

Specify the implementation library for `Sass` when the `Object` type is specified

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

### postcss

- plugins
- processOptions

See [postcss](https://github.com/postcss/postcss#options) for detailed configuration

### inject

Configure whether to insert style into js in packaged mode

- type: `boolean`
- default: `false`

After opening inject, you will see an extra piece of style code in the js file. For example, if you write `import '. /index.scss'`，you will see the following code.

```js dist/index.js
// node_modules/.pnpm/style-inject@0.3.0/node_modules/style-inject/dist/style-inject.es.js
function styleInject(css, ref) {
  // ...
}
var style_inject_es_default = styleInject;

// src/index.scss
var css_248z = '.body {\n color: black;\n}';
style_inject_es_default(css_248z);
```

:::tip {title="Note"}

With `inject` turned on, you need to pay attention to the following points.

- `@import` in the css file will not be processed. So if you have `@import` in your css file, then you need to bring in the css file manually in js (less,scss files don't need it because they will be preprocessed).
- The impact of `sideEffects` needs to be considered, by default our builder will consider it as a side effect, if the `sideEffects` field set in your project or in the package.json of the three-way package and it does not contain this css file, then you will get a warning

```
[LIBUILD:ESBUILD_WARN] Ignoring this import because "src/index.scss" was marked as having no side effects by plugin "libuild:adapter"
```

This can be fixed by configuring [sideEffects](#sideeffects) in this case.

:::

### autoModules

Enable CSS Modules automatically based on the filename.

- type: `boolean | RegExp`
- default: `true`

`true` : Enables CSS Modules for style files ending with `.module.css` `.module.less` `.module.scss` `.module.sass` filenames

`false` : Disable CSS Modules.

`RegExp` : Enables CSS Modules for all files that match the regular condition.

### modules

CSS Modules configuration

- type: `Object`
- default: `{}`

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

### tailwindcss

tailwindcss related configuration

- type: `Object | Function`
- default: `see configuration details below`

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

When the value is of type `Object`, it is merged with the default configuration via `Object.assign`.

When the value is of type `Function`, the object returned by the function is merged with the default configuration via `Object.assign`.

The `theme` property is not allowed, otherwise the build will fail, using [`designSystem`](/api/config/design-system) as the `Tailwind CSS Theme` configuration.

The rest of the usage is the same as Tailwind CSS: [Quick Portal](https://tailwindcss.com/docs/configuration).

## target

Specify the target environment for the build

- type: `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'`
- default: `'es6'`

<!-- ## transformImport

Using [SWC](https://swc.rs/) provides the same ability and configuration as [`babel-plugin-import`](https://github.com/umijs/babel-plugin-import).

* **Type**: `Array`
* **Default**: `[]`

The elements of the array are configuration objects for `babel-plugin-import`, which can be referred to [options](https://github.com/umijs/babel-plugin-import#options)。

**Example:**

```ts
import moduleTools, { defineConfig} from '@modern-js/module-tools';

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
  plugins: [
    moduleTools(),
  ],
});
```

### Notes

Reference the [Import Plugin - Notes](plugins/official-list/plugin-import.html#Notes) -->

## umdGlobals

Specify global variables for external import of umd products

- type: `Record<string, string>`
- default: `{}`

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

- type: `string` | `Function`
- default: `name => name`

```js
export default {
  buildConfig: {
    format: 'umd',
    umdModuleName: 'myLib',
  },
};
```

At this point the umd product will go to mount on `global.myLib`

:::tip

- The module name of the umd product must not conflict with the global variable name.
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
