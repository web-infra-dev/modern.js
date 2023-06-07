---
sidebar_position: 1
---

# BuildConfig

本章节描述了 Module Tools 关于构建的所有配置

## alias

- 类型：`Record<string, string> | Function`
- 默认值：`{'@': 'src',}`

:::tip
对于 TypeScript 项目，只需要在 `tsconfig.json` 中配置 [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths), Module Tools 会自动识别 `tsconfig.json` 里的别名，因此不需要额外配置 `alias` 字段。
:::

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    alias: {
      '@common': './src/common',
    },
  },
});
```

以上配置完成后，如果在代码中引用 `@common/Foo.tsx`, 则会映射到 `<root>/src/common/Foo.tsx` 路径上。

`alias` 的值定义为函数时，可以接受预设的 alias 对象，并对其进行修改。

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    alias: alias => {
      alias['@common'] = './src/common';
    },
  },
});
```

也可以在函数中返回一个新对象作为最终结果，新对象会覆盖预设的 alias 对象。

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    alias: alias => {
      return {
        '@common': './src/common',
      };
    },
  },
});
```

## asset

### path

静态资源输出路径，会基于 [outDir](/api/config/build-config#outDir) 进行输出。

- 类型： `string`
- 默认值： `assets`

### limit

打包时自动内联静态资源的阈值，小于 10KB 的资源会被自动内联进 bundle 产物中。

- 类型： `number`
- 默认值： `10 * 1024`

### publicPath

打包时给未内联资源的 CDN 前缀。

- 类型： `string`
- 默认值： `undefined`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    asset: {
      publicPath: 'https://xxx/',
    },
  },
});
```

此时，所有静态资源都会添加 `https://xxx/` 前缀。

### svgr

打包时将 SVG 作为一个 React 组件处理，options 参考 [svgr](https://react-svgr.com/docs/options/)，另外还支持了 `include` 和 `exclude` 两个配置项，用于匹配需要处理的 SVG 文件。

- 类型： `boolean | Object`
- 默认值： `false`

开启 svgr 功能后，可以使用默认导出的方式将 SVG 当做组件使用。

```js index.ts
// true
import Logo from './logo.svg';

export default () => <Logo />;
```

:::warning

目前不支持下面的用法：

```js index.ts
import { ReactComponent } from './logo.svg';
```

:::

当开启功能后，可以通过在 `modern-app-env.d.ts` 文件中增加类型定义，修改使用 SVG 的类型：

```ts modern-app-env.d.ts focus=1:3
declare module '*.svg' {
  const src: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default src;
}

/// <reference types='@modern-js/module-tools/types' />
```

#### include

设定匹配的 SVG 文件

- 类型： `string | RegExp | (string | RegExp)[]`
- 默认值： `/\.svg$/`

#### exclude

设定不匹配的 SVG 文件

- 类型： `string | RegExp | (string | RegExp)[]`
- 默认值： `undefined`

## autoExternal

自动外置项目的 `"dependencies"` 和 `"peerDependencies"`，不会将其打包到最终的 bundle 产物中。

- 类型： `boolean | Object`
- 默认值： `true`

当我们希望关闭对于第三方依赖的默认处理行为时候，可以通过以下方式来实现：

```ts modern.config.ts
export default defineConfig({
  buildConfig: {
    autoExternal: false,
  },
});
```

这样对于 `"dependencies"` 和 `"peerDependencies"` 下面的依赖都会进行打包处理。如果只想要关闭其中某个下面的依赖处理，则可以使用
`buildConfig.autoExternal` 的对象形式：

```ts modern.config.ts
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

是否需要外置项目的 `"dependencies"` 依赖。

- 类型： `boolean`
- 默认值： `true`

### peerDependencies

是否需要外置项目的 `"peerDependencies"` 依赖。

- 类型： `boolean`
- 默认值： `true`

## buildType

构建类型，`bundle` 会打包你的代码，`bundleless` 只做代码的转换。

- 类型： `'bundle' | 'bundleless'`
- 默认值： `bundle`

## copy

将文件或目录拷贝到指定位置。

- 类型： `Object`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [{ from: './src/assets', to: '' }],
    },
  },
});
```

### `copy.patterns`

- 类型： `CopyPattern[]`
- 默认值： `[]`

```ts
export interface CopyPattern {
  from: string;
  to?: string;
  context?: string;
  globOptions?: globby.GlobbyOptions;
}
```

### copy.options

- 类型： `Object`
- 默认值： `{ concurrency: 100, enableCopySync: false }`

```ts
type Options = {
  concurrency?: number;
  enableCopySync?: boolean;
};
```

- `concurrency`: 指定并行执行多少个复制任务。
- `enableCopySync`: 使用 [`fs.copySync`](https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/copy-sync.js)，默认情况下 [`fs.copy`](https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/copy.js)。

## define

定义全局变量，会被注入到代码中

- 类型： `Record<string, string>`
- 默认值： `{}`

由于 `define` 功能是由全局文本替换实现的，所以需要保证全局变量值为字符串，更为安全的做法是将每个全局变量的值转化为字符串，使用 `JSON.stringify` 进行转换，如下所示：

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    define: {
      VERSION: JSON.stringify('1.0'),
    },
  },
});
```

:::tip
为了防止全局替换替换过度，建议使用时遵循以下两个原则：

- 全局常量使用大写
- 自定义全局常量前缀后缀，确保独一无二

:::

<!-- ## disableSwcTransform

从 2.16.0 版本开始，默认开启 SWC Transform 进行代码转换。如果想要关闭该功能，可以使用该配置。此时仅使用 esbuild Transform。

使用 SWC Transform 可以减小辅助函数对构建产物体积的影响。

* 类型：`boolean`
* 默认值：`false` -->

## dts

类型文件生成的相关配置，默认情况会生成。

- 类型： `false | Object`
- 默认值：

```js
{
  abortOnError: true,
  distPath: './',
  only: false,
  tsconfigPath: './tsconfig.json',
}
```

### abortOnError

在出现类型错误的时候，是否允许构建成功。**默认情况下，在出现类型错误的时候会导致构建失败**。

:::warning
当关闭该配置后，无法保证类型文件能正常生成，且不保证内容正确。在 `buildType: 'bundle'`，即打包模式下，类型文件一定不会生成。
:::

- 类型：`boolean`
- 默认值：`true`

### distPath

类型文件的输出路径，基于 [outDir](/api/config/build-config#outDir) 进行输出。

- 类型: `string`
- 默认值: `./types`

### only

只生成类型文件，不生成 js 文件。

- 类型： `boolean`
- 默认值： `false`

### respectExternal

当设为 `false` 时，不会打包任何三方包类型，设为 `true` 时，会根据[externals](#externals)来决定是否需要打包三方类型。

在做 d.ts bundle 时，还没有分析 export，所以你使用的任何一个三方包类型都可能会破坏你的构建，这显然是不可控的，
因此我们可以通过此配置来避免。

- 类型： `boolean`
- 默认值： `true`

### tsconfigPath

TypeScript 配置文件的路径。

- 类型： `string`
- 默认值： `./tsconfig.json`

## esbuildOptions

直接修改[esbuild 配置](https://esbuild.github.io/api/)

- 类型: `Function`
- 默认值: `c => c`

例如我们需要修改生成文件的后缀：

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    esbuildOptions: options => {
      options.outExtension = { '.js': '.mjs' };
      return option;
    },
  },
});
```

:::tip
我们在原本 esbuild 构建的基础上做了许多扩展，因此使用此配置需要注意以下几点：

1. 优先使用我们提供的配置，例如 esbuild 并不支持`target: 'es5'`，但我们内部使用 swc 支持了此场景，此时通过`esbuildOptions`设置`target: 'es5'`会报错。
2. 目前我们内部使用`enhanced-resolve`替代了 esbuild 的 resolve 解析算法，所以修改 esbuild resolve 相关配置无效，计划在未来会切换回来。
3. 使用 esbuild 插件时需要将插件加在 plugins 数组的头部，因为我们内部也是通过一个 esbuild 插件介入到整个构建流程中去的，因此需要将自定义插件优先注册。

:::

## externalHelpers

默认情况下，输出的 JS 代码可能会依赖一些辅助函数来支持目标环境或者输出格式，这些辅助函数会被内联在需要它的文件中。

当在使用 SWC Transform 进行代码转换的时候，可以启动 `externalHelpers` 配置，将内联的辅助函数转换为从外部模块 `@swc/helpers` 导入这些辅助函数。

- 类型：`boolean`
- 默认值：`false`

下面是使用该配置前后的产物变化比较。

开启前：

``` js ./dist/index.js
// 辅助函数
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  // ...
}
// 辅助函数
function _async_to_generator(fn) {
  return function() {
    // use asyncGeneratorStep
    // ...
  };
}

// 你的代码
export var yourCode = function() {
  // use _async_to_generator
}
```

开启后：

``` js ./dist/index.js
// 从 @swc/helpers 导入的辅助函数
import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";

// 你的代码
export var yourCode = function() {
  // use _async_to_generator
}
```

## externals

配置外部依赖，不会被打包到最终的 bundle 中。

- 类型： `(string | RegExp)[]`
- 默认值： `[]`

## format

js 产物输出的格式,其中 `iife` 和 `umd` 只能在 `buildType` 为 `bundle` 时生效。

- 类型： `'esm' | 'cjs' | 'iife' | 'umd'`
- 默认值： `cjs`

## input

指定构建的入口文件，数组形式可以指定目录。

- 类型： `string[] | Record<string, string>`
- 默认值： `bundle` 模式下默认为 `['src/index.ts']`，`bundleless` 模式下默认为 `['src']`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    input: ['src/index.ts', 'src/index2.ts'],
  },
});
```

## jsx

指定 jsx 的编译方式, 默认支持 React17 以上,自动注入 jsx 运行时代码。

- 类型： `automatic | classic`
- 默认值： `automatic`

## metafile

esbuild 以 JSON 格式生成有关构建的一些元数据，可以通过例如 [bundle-buddy](https://bundle-buddy.com/esbuild) 的工具可视化

- 类型：`boolean`
- 默认值：`false`

## minify

使用 esbuild 或者 terser 压缩代码，也可以传入 [terserOptions](https://github.com/terser/terser#minify-options)。

- 类型： `'terser' | 'esbuild' | false | Object`
- 默认值： `false`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    minify: {
      compress: {
        drop_console: true,
      },
    },
  },
});
```

## outDir

指定构建的输出目录

- 类型: `string`
- 默认值: `dist`

## platform

默认生成用于 Node.js 环境下的代码，你也可以指定为 `browser`，会生成用于浏览器环境的代码。

- 类型： `'browser' | 'node'`
- 默认值： `node`

## redirect

在 `buildType: 'bundleless'` 构建模式下，会对引用路径进行重定向，确保指向了正确的产物，例如：

- `import './index.less'` 会被改写成 `import './index.css'`
- `import icon from './close.svg'` 会被改写成 `import icon from '../asset/close.svg'`（依实际情况而定）

在某些场景下，你可能不需要这些功能，那么可以通过此配置关闭它，关闭后，其引用路径将不会发生改变。

```ts
export default {
  buildConfig: {
    redirect: {
      alias: false, // 关闭对别名路径的修改
      style: false, // 关闭对样式文件路径的修改
      asset: false, // 关闭对资源文件路径的修改
    },
  },
};
```

## sideEffects

配置模块的副作用

- 类型： `RegExg[] | (filePath: string, isExternal: boolean) => boolean | boolean`
- 默认值： `undefined`

通常情况下，我们通过 package.json 的 `"sideEffects"` 字段来配置模块的副作用，但是在某些情况下，三方包的 package.json 是不可靠的。
例如我们引用了一个三方包的样式文件。

```js
import 'other-package/dist/index.css';
```

但是这个三方包的 package.json 里并没有将样式文件配置到 `"sideEffects"` 里。

```json other-package/package.json
{
  "sideEffects": ["dist/index.js"]
}
```

同时你又设置了[style.inject](#inject)为 `true`，在控制台可以看到类似的警告信息：

```bash
[LIBUILD:ESBUILD_WARN] Ignoring this import because "other-package/dist/index.css" was marked as having no side effects
```

这时候就可以使用这个配置项，手动配置模块的`"sideEffects"`，配置支持正则和函数形式。

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
添加此配置后，打包时将不会再读取 package.json 里的 `"sideEffects"` 字段。
:::

## sourceDir

指定构建的源码目录,默认为 `src`，用于在 `bundleless` 构建时基于源码目录结构生成对应的产物目录。

- 类型： `string`
- 默认值： `src`

## sourceMap

控制 sourceMap 如何生成。

- 类型： `boolean | 'inline' | 'external'`
- 默认值： `false`

## sourceType

设置源码的格式。默认情况下，会将源码作为 EsModule 进行处理。当源码使用的是 CommonJS 的时候，需要设置 `commonjs`。

- 类型：`commonjs` | `module`
- 默认值：`module`

## splitting

是否开启代码分割。

- 类型： `boolean`
- 默认值： `false`

## style

配置样式相关的配置。

### less

less 相关配置。

#### lessOptions

详细配置参考 [less](https://less.bootcss.com/usage/#less-options)。

- 类型： `Object`
- 默认值： `{ javascriptEnabled: true }`

#### additionalData

在入口文件起始添加 `Less` 代码。

- 类型： `string`
- 默认值： `undefined`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    style: {
      less: {
        additionalData: `@base-color: #c6538c;`,
      },
    },
  },
});
```

#### implementation

配置 `Less` 使用的实现库，在不指定的情况下，使用的内置版本是 `4.1.3`。

- 类型： `string | Object`
- 默认值： `undefined`

`Object` 类型时，指定 `Less` 的实现库

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    style: {
      less: {
        implementation: require('less'),
      },
    },
  },
});
```

`string` 类型时，指定 `Less` 的实现库的路径

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    style: {
      less: {
        implementation: require.resolve('less'),
      },
    },
  },
});
```

### sass

Sass 相关配置。

#### sassOptions

详细配置参考 [node-sass](https://github.com/sass/node-sass#options)

- 类型： `Object`
- 默认值： `{}`

#### additionalData

在入口文件起始添加 `Sass` 代码。

- 类型： `string | Function`
- 默认值： `undefined`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    style: {
      sass: {
        additionalData: `$base-color: #c6538c;
          $border-dark: rgba($base-color, 0.88);`,
      },
    },
  },
});
```

#### implementation

配置 `Sass` 使用的实现库，在不指定的情况下，使用的内置版本是 `1.5.4`。

- 类型： `string | Object`
- 默认值： `undefined`

`Object` 类型时，指定 `Sass` 的实现库

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    style: {
      sass: {
        implementation: require('sass'),
      },
    },
  },
});
```

`string` 类型时，指定 `Sass` 的实现库的路径

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    style: {
      sass: {
        implementation: require.resolve('sass'),
      },
    },
  },
});
```

### postcss

- plugins
- processOptions

详细配置查看 [postcss](https://github.com/postcss/postcss#options)。

### inject

配置打包模式下是否将 style 插入到 js 中

- 类型： `boolean`
- 默认值： `false`

开启 inject 后，你会看到打包后的 js 文件中会多出一段 style 的代码。例如你在源码里写了`import './index.scss'`，那么你会看到以下代码。

```js dist/index.js
// node_modules/.pnpm/style-inject@0.3.0/node_modules/style-inject/dist/style-inject.es.js
function styleInject(css, ref) {
  // ...
}
var style_inject_es_default = styleInject;

// src/index.scss
var css_248z = '.body {\n  color: black;\n}';
style_inject_es_default(css_248z);
```

:::tip

开启了 `inject` 后，你需要注意以下几点：

- css 文件中的 `@import` 不会被处理。因此如果你的 css 文件中有 `@import` ，那么你需要在 js 中手动引入 css 文件(less,scss 文件不需要，因为它们会有预处理)。
- 需要考虑 `sideEffects`的影响，默认情况下我们的构建器会认为它是有副作用的，如果你的项目中或者三方包的 package.json 设置了 `sideEffects` 字段并且没有包含此 css 文件，那么你将会得到一个警告

```
[LIBUILD:ESBUILD_WARN] Ignoring this import because "src/index.scss" was marked as having no side effects by plugin "libuild:adapter"
```

此时可以通过配置[sideEffects](#sideeffects)来解决。

:::

### autoModules

根据文件名自动启用 CSS Modules。

- 类型： `boolean | RegExp`
- 默认值： `true`

`true` : 为以 `.module.css` `.module.less` `.module.scss` `.module.sass` 文件名结尾的样式文件启用 CSS Modules。

`false` : 禁用 CSS Modules.

`RegExp` : 为匹配正则条件的所有文件启用 CSS Modules.

### modules

CSS Modules 配置

- 类型： `Object`
- 默认值： `{}`

一个常用的配置是 `localsConvention`，它可以改变 CSS Modules 的类名生成规则。

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    style: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  },
});
```

对于以下样式：

```css
.box-title {
  color: red;
}
```

你可以使用 `styles.boxTitle` 来访问

详细配置查看 [postcss-modules](https://github.com/madyankin/postcss-modules#usage)

### tailwindcss

Tailwind CSS 相关配置。

- 类型： `Object | Function`
- 默认值： `见下方配置详情`

<details>
  <summary>Tailwind CSS 配置详情</summary>

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

值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

值为 `Function` 类型时，函数返回的对象与默认配置通过 `Object.assign` 合并。

不允许出现 `theme` 属性，否则会构建失败, 使用 [`designSystem`](/api/config/design-system) 作为 `Tailwind CSS Theme` 配置。

其他的使用方式和 Tailwind CSS 一致: [快速传送门](https://tailwindcss.com/docs/configuration)。

## target

指定构建的目标环境

- 类型： `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'`
- 默认值： `'es6'`

## transformImport

提供与 babel-plugin-import 等价的能力和配置，基于 SWC 实现。

- 类型：`Array`
- 默认值：`[]`

数组元素为一个 babel-plugin-import 的配置对象。配置对象可以参考 [options](https://github.com/umijs/babel-plugin-import#options)。

使用示例：

```ts
import moduleTools, { defineConfig} from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    transformImport: [
      // babel-plugin-import 的 options 配置
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

### 注意事项

参考[【Import 插件——注意事项】](plugins/official-list/plugin-import.html#注意事项)

## umdGlobals

指定 UMD 产物外部导入的全局变量。

- 类型： `Record<string, string>`
- 默认值： `{}`

```ts modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    umdGlobals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
});
```

此时，`react` 和 `react-dom` 会被看做是外部导入的全局变量，不会被打包进 UMD 产物中，而是通过 `global.React` 和 `global.ReactDOM` 的方式进行访问。

## umdModuleName

指定 UMD 产物的模块名。

- 类型： `string` | `Function`
- 默认值： `name => name`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    format: 'umd',
    umdModuleName: 'myLib',
  },
});
```

此时 UMD 产物会去挂载到 `global.myLib` 上。

:::tip

- 需要遵守 UMD 规范，UMD 产物的模块名不能和全局变量名冲突。
- 模块名会被转换为驼峰命名，如 `my-lib` 会被转换为 `myLib`，可参考[toIdentifier](https://github.com/babel/babel/blob/main/packages/babel-types/src/converters/toIdentifier.ts)。

:::

同时函数形式可以接收一个参数，为当前打包文件的输出路径

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
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
});
```
