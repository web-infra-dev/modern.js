# Build
本章节描述了Module tools关于构建的所有配置
## alias
- type: `Record<string, string | string[]> | Function`
- default: `{'@': 'src',}`

:::tip
对于 TypeScript 项目，只需要在 `tsconfig.json` 中配置 [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths), Module tools会自动识别 `tsconfig.json` 里的别名，因此不需要额外配置 `alias` 字段。
:::

```js
export default {
  build: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

以上配置完成后，如果在代码中引用 `@common/Foo.tsx`, 则会映射到 `<root>/src/common/Foo.tsx` 路径上。

`alias` 的值定义为函数时，可以接受预设的 alias 对象，并对其进行修改。

```js
export default {
  build: {
    alias: alias => {
      alias['@common'] = './src/common';
    },
  },
};
```

也可以在函数中返回一个新对象作为最终结果，新对象会覆盖预设的 alias 对象。

```js
export default {
  build: {
    alias: alias => {
      return {
        '@common': './src/common',
      };
    },
  },
};
```

## asset

### path
静态资源输出路径，会基于[outdir](/zh/api/config-build/#outdir)进行输出

- type: `string`
- default: `assets`

### limit
打包时自动内联静态资源的阈值，小于14336字节的资源会被自动内联进bundle产物中

- type: `number`
- default: `14 * 1024`

### publicPath
打包时给未内联资源的CDN前缀
- type: `string`
- default: `undefined`
```js
export default {
  output: {
    publicPath: 'https://xxx/'
  }
};
```
此时，所有静态资源都会添加`https://xxx/`前缀

### svgr
打包时将svg作为一个React组件处理
- type: `boolean | object`

#### svgr.include
设定匹配的svg文件
- type: `string | RegExp | (string | RegExp)[]`
- default: `/\.svg$/`

#### svgr.exclude
设定不匹配的svg文件
- type: `string | RegExp | (string | RegExp)[]`
- default: `undefined`


## autoExternal
自动外置项目的dependencies和peerDependencies，不会将其打包到最终的bundle中
- type: `boolean | object`
- default: `true`

### autoExternal.dependencies
是否需要外置项目的dep依赖
- type: `boolean`
- default: `true`

### autoExternal.peerDependencies
是否需要外置项目的peerDep依赖
- type: `boolean`
- default: `true`

## buildType
构建类型，`bundle`会打包你的代码，`bundleless`只做代码的转换
- type: `'bundle' | 'bundleless'`
- default: `bundle`

## copy
将指定的文件或目录拷贝到构建输出目录中
- type: `Array`
- default: `[]`

数组设置参考：[copy-webpack-plugin patterns](https://github.com/webpack-contrib/copy-webpack-plugin#patterns)

## define
定义全局变量，会被注入到代码中
- type: `Record<string, string>`
- default: `{}`

由于`define`功能是由全局文本替换实现的，所以需要保证全局变量值为字符串，更为安全的做法是将每个全局变量的值转化为字符串，使用`JSON.stringify`进行转换，如下所示：
```js
export default {
  build: {
    define: {
      'VERSION': JSON.stringify('1.0'),

    },
  },
};
```

:::tip
为了防止全局替换替换过度，建议使用时遵循以下两个原则：
- 全局常量使用大写
- 自定义全局常量前缀后缀，确保独一无二
:::

## dts
dts文件生成相关配置，默认会生成

- type: `false | object`
- default: `{}`

### dts.tsconfigPath
tsconfig文件的路径
- type: `string`
- default: `./tsconfig.json`

### dts.distPath
dts文件的输出路径,基于[outdir]('/zh/api/config-build/#outdir')进行输出
- type: `string`
- default: `./types`

### dts.only
只生成dts文件，不生成js文件
- type: `boolean`
- default: `false`

## externals
配置外部依赖，不会被打包到最终的bundle中
- type: `(string | RegExp)[]`
- default: `[]`
## format
js产物输出的格式,其中`iife`和`umd`只能在`buildType`为`bundle`时生效
- type: `'esm' | 'cjs' | 'iife' | 'umd'`
- default: `cjs`

## input
指定构建的入口文件,数组形式可以指定目录
- type: `string[] | Record<string, string>`
- default: `bundle`模式下默认为`['src/index.ts']`，`bundleless`模式下默认为`['src']`

```js
export default {
  build: {
    input: ['src/index.ts', 'src/index2.ts'],
  },
};
```

## jsx
指定jsx的编译方式, 默认支持React17,自动注入jsx运行时代码
- type: `automatic | classic`
- default: `automatic`

## minify
使用esbuild或者terser压缩代码，也可以传入[terserOptions](https://github.com/terser/terser#minify-options)
- type: `'terser' | 'esbuild' | false | object`
- default: `false`

```js
export default {
  build: {
    minify: {
      compress: {
        drop_console: true,
      },
    },
  },
};
```

## outdir
指定构建的输出目录
- type: `string`
- default: `dist`

## platform
默认生成用于node环境下的代码，你也可以指定为`browser`，会生成用于浏览器环境的代码
- type: `'browser' | 'node'`
- default: `node`

## sourceDir
指定构建的源码目录,默认为`src`,用于在`bundleless`构建时基于源码目录结构生成对应的产物目录
- type: `string`
- default: `src`

## sourceMap
是否生成sourceMap
- type: `boolean | 'inline' | 'external'`
- default: `false`

## splitting
是否开启代码分割
- type: `boolean`
- default: `false`

## target
指定构建的目标环境
- type: `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'`
- default: `es2015`


## umdGlobals
指定umd产物外部导入的全局变量
- type: `Record<string, string>`
- default: `{}`

```js
export default {
  build: {
    umdGlobals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  }
}
```
此时，`react`和`react-dom`会被看做是外部导入的全局变量，不会被打包进umd产物中，而是通过`global.React`和`global.ReactDOM`的方式进行访问

## umdModuleName
指定umd产物的模块名

- type: `string` | `Function`
- default: `name => name`

```js
export default {
  build: {
    umdModuleName: 'myLib',
  }
}
```
此时umd产物会去挂载到`global.myLib`上
:::tip
- 需要遵守umd规范，umd产物的模块名不能和全局变量名冲突
- 模块名不能含有`-`，`@`，`/`等特殊字符
:::

同时函数形式可以接收一个参数，为当前打包文件的输出路径
```js
export default {
  build: {
    umdModuleName: (name) => {
      if (name.includes('index')) {
        return 'myLib';
      } else {
        return 'myLib2';
      }
    },
  }
}
```
