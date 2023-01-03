# BuildConfig

本章节描述了 Module tools 关于构建的所有配置
## alias
- 类型：`Record<string, string | string[]> | Function`
- 默认值：`{'@': 'src',}`

:::tip
对于 TypeScript 项目，只需要在 `tsconfig.json` 中配置 [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths), Module tools 会自动识别 `tsconfig.json` 里的别名，因此不需要额外配置 `alias` 字段。
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

静态资源输出路径，会基于 [outDir](/zh/api/build-config/#outDir) 进行输出。


- 类型： `string`
- 默认值： `assets`

### limit
打包时自动内联静态资源的阈值，小于 10KB 的资源会被自动内联进 bundle 产物中。

- 类型： `number`
- 默认值： `10 * 1024`

### publicPath
打包时给未内联资源的CDN前缀。
- 类型： `string`
- 默认值： `undefined`
```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    asset: {
      publicPath: 'https://xxx/'
    }
  }
});
```
此时，所有静态资源都会添加 `https://xxx/` 前缀。

### svgr
打包时将 svg 作为一个 React 组件处理，options 参考 [svgr](https://react-svgr.com/docs/options/)，另外还支持了 `include` 和 `exclude` 两个配置项，用于匹配需要处理的svg文件。
- 类型： `boolean | Object`
- 默认值： `false`

#### include
设定匹配的 svg 文件
- 类型： `string | RegExp | (string | RegExp)[]`
- 默认值： `/\.svg$/`

#### exclude
设定不匹配的 svg 文件
- 类型： `string | RegExp | (string | RegExp)[]`
- 默认值： `undefined`


## autoExternal
自动外置项目的 `"dependencies"` 和 `"peerDependencies"`，不会将其打包到最终的 bundle 产物中。
- 类型： `boolean | Object`
- 默认值： `true`

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

``` ts
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

``` ts
type Options = {
  concurrency?: number;
  enableCopySync?: boolean;
};
```

* `concurrency`: 指定并行执行多少个复制任务。
* `enableCopySync`: 使用 [`fs.copySync`](https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/copy-sync.js)，默认情况下 [`fs.copy`](https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/copy.js)。

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
      'VERSION': JSON.stringify('1.0'),

    },
  },
});
```

:::tip
为了防止全局替换替换过度，建议使用时遵循以下两个原则：
- 全局常量使用大写
- 自定义全局常量前缀后缀，确保独一无二
:::

## dts
类型文件生成的相关配置，默认会生成。

- 类型： `false | Object`
- 默认值： `{}`

### tsconfigPath

TypeScript 配置文件的路径。
- 类型： `string`
- 默认值： `./tsconfig.json`

### distPath

类型文件的输出路径，基于 [outDir](/zh/api/build-config/#outDir) 进行输出。
- 类型: `string`
- 默认值: `./types`

### only
只生成类型文件，不生成 js 文件。
- 类型： `boolean`
- 默认值： `false`

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

## sourceDir
指定构建的源码目录,默认为 `src`，用于在 `bundleless` 构建时基于源码目录结构生成对应的产物目录。
- 类型： `string`
- 默认值： `src`

## sourceMap
控制 sourceMap 如何生成。
- 类型： `boolean | 'inline' | 'external'`
- 默认值： `false`

## splitting
是否开启代码分割。
- 类型： `boolean`
- 默认值： `false`

## style
配置样式相关的配置。

### less

less相关配置。
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
    }
  }
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
    }
  }
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
    }
  }
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
    }
  }
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
    }
  }
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
    }
  }
});
```

### postcss
- plugins
- processOptions

详细配置查看 [postcss](https://github.com/postcss/postcss#options)。
### inject
配置打包模式下是否将style插入到js中

- 类型： `boolean`
- 默认值： `false`

### autoModules
根据文件名自动启用 CSS Modules。

- 类型： `boolean | RegExp`
- 默认值： `true `

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
    }
  }
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

不允许出现 `theme` 属性，否则会构建失败, 使用 [`designSystem`](/zh/api/design-system) 作为 `Tailwind CSS Theme` 配置。

其他的使用方式和 Tailwind CSS 一致: [快速传送门](https://tailwindcss.com/docs/configuration)。


## target
指定构建的目标环境
- 类型： `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'`
- 默认值： `'es2015'`


## umdGlobals
指定 UMD 产物外部导入的全局变量。
- 类型： `Record<string, string>`
- 默认值： `{}`

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    umdGlobals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  }
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
  }
});
```
此时 UMD 产物会去挂载到 `global.myLib` 上。
:::tip
- 需要遵守 UMD 规范，UMD 产物的模块名不能和全局变量名冲突
- 模块名不能含有 `-`，`@`，`/` 等特殊字符
:::

同时函数形式可以接收一个参数，为当前打包文件的输出路径
```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    format: 'umd',
    umdModuleName: (path) => {
      if (path.includes('index')) {
        return 'myLib';
      } else {
        return 'myLib2';
      }
    },
  }
});
```
