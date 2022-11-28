# Build
This section describes all the configuration of Module tools for building
## alias
- type: `Record<string, string | string[]> | Function`
- default: `{'@': 'src',}`

:::tip
For TypeScript projects, you only need to configure [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) in `tsconfig.json`, Module tools will automatically recognize the alias in `tsconfig.json`, so there is no need to configure the `alias` field additionally.
:::

```js
export default {
  build: {
    alias: {
      '@common': '. /src/common',
    },
  },
};
```

After the above configuration is done, if `@common/Foo.tsx` is referenced in the code, it will map to the `<root>/src/common/Foo.tsx` path.

When the value of `alias` is defined as a function, you can accept the pre-defined alias object and modify it.

```js
export default {
  build: {
    alias: alias => {
      alias['@common'] = '. /src/common';
    },
  },
};
```

It is also possible to return a new object as the final result in the function, which will override the pre-defined alias object.

```js
export default {
  build: {
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
Static resource output path, will be based on [outdir](/zh/api/config-build/#outdir)

- type: `string`
- default: `assets`

### limit
The threshold for automatically inlining static resources when building, resources less than 14336 bytes will be automatically inlined into the bundle product

- type: `number`
- default: `14 * 1024`

### publicPath
The CDN prefix given to unlinked resources when packaging
- type: `string`
- default: `undefined`
```js
export default {
  output: {
    publicPath: 'https://xxx/'
  }
};
```
At this point, all static resources will be prefixed with `https://xxx/`

### svgr
Treat svg as a React component when packaging
- type: `boolean | object`

#### svgr.include
Set the matching svg file
- type: `string | RegExp | (string | RegExp)[]`
- default: `/\.svg$/`

#### svgr.exclude
Set mismatched svg files
- type: `string | RegExp | (string | RegExp)[]`
- default: `undefined`


## autoExternal
Automatically externalize project dependencies and peerDependencies and not package them into the final bundle
- type: `boolean | object`
- default: `true`

### autoExternal.dependencies
Whether to require external project dep dependencies
- type: `boolean`
- default: `true`

### autoExternal.peerDependencies
Whether to require peerDep dependencies for external projects
- type: `boolean`
- default: `true`

## buildType
Build type, `bundle` will package your code, `bundleless` only does code conversions
- type: `'bundle' | 'bundleless'`
- default: `bundle`

## copy
Copies the specified file or directory into the build output directory
- type: `Array`
- default: `[]`

Array settings reference: [copy-webpack-plugin patterns](https://github.com/webpack-contrib/copy-webpack-plugin#patterns)

## define
Define global variables that will be injected into the code
- type: `Record<string, string>`
- default: `{}`

Since the `define` function is implemented by global text replacement, you need to ensure that the global variable values are strings. A safer approach is to convert the value of each global variable to a string, using `JSON.stringify`, as follows.
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
To prevent excessive global replacement substitution, it is recommended that the following two principles be followed when using
- Use upper case for global constants
- Customize the prefix and suffix of global constants to ensure uniqueness
:::

## dts
The dts file generates the relevant configuration, by default it generates

- type: `false | object`
- default: `{}`

### dts.tsconfigPath
Path to the tsconfig file
- type: `string`
- default: `. /tsconfig.json`

### dts.distPath
The output path of the dts file, based on [outdir]('/zh/api/config-build/#outdir')
- type: `string`
- default: `. /types`

### dts.only
Generate only dts files, not js files
- type: `boolean`
- default: `false`

## externals
Externalize the specified module, which will not be packaged into the final bundle
- type: `(string | RegExp)[]`
- default: `[]`
## format
The format of the js product output, where `iife` and `umd` can only take effect when `buildType` is `bundle`.
- type: `'esm' | 'cjs' | 'iife' | 'umd'`
- default: `cjs`

## input
Specify the entry file for the build, in the form of an array that can specify the directory
- type: `string[] | Record<string, string>`
- default: `['src/index.ts']` in `bundle` mode, `['src']` in `bundleless` mode

```js
export default {
  build: {
    input: ['src/index.ts', 'src/index2.ts'],
  },
};
```

## jsx
Specify the compilation method of jsx, default support React17, automatically inject jsx runtime code
- type: `automatic | classic`
- default: `automatic`

## minify
Use esbuild or terser to compress code, also pass [terserOptions](https://github.com/terser/terser#minify-options)
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
Specifies the output directory of the build
- type: `string`
- default: `dist`

## platform
Generates code for the node environment by default, you can also specify `browser` which will generate code for the browser environment
- type: `'browser' | 'node'`
- default: `node`

## sourceDir
Specify the source directory of the build, default is `src`, which is used to generate the corresponding product directory based on the source directory structure when building `bundleless`.
- type: `string`
- default: `src`

## sourceMap
Whether to generate sourceMap or not
- type: `boolean | 'inline' | 'external'`
- default: `false`

## splitting
Whether to enable code splitting
- type: `boolean`
- default: `false`

## target
Specify the target environment for the build
- type: `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'`
- default: `es2015`


## umdGlobals
Specify global variables for external import of umd products
- type: `Record<string, string>`
- default: `{}`

``js
export default {
  build: {
    umdGlobals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  }
}
```
At this point, `react` and `react-dom` will be seen as global variables imported externally and will not be packed into the umd product, but will be accessible by way of `global.React` and `global.ReactDOM`

## umdModuleName
Specifies the module name of the umd product

- type: `string` | `Function`
- default: `name => name`

``js
export default {
  build: {
    umdModuleName: 'myLib',
  }
}
```
At this point the umd product will go and mount to `global.myLib`
:::tip
- The module name of the umd product must not conflict with the global variable name.
- Module names should not contain special characters like `-`, `@`, `/`, etc.
:::

Also the function form can take one parameter, which is the output path of the current package file
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
