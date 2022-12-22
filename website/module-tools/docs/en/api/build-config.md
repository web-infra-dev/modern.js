# BuildConfig
This section describes all the configuration of Module tools for building
## alias
- type: `Record<string, string | string[]> | Function`
- default: `{'@': 'src',}`

:::tip
For TypeScript projects, you only need to configure [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) in `tsconfig.json`, Module tools will automatically recognize the alias in `tsconfig.json`, so there is no need to configure the `alias` field additionally.
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
Static resource output path, will be based on [outdir](/zh/api/build-config/#outdir)

- type: `string`
- default: `assets`

### limit
Threshold for automatically inlining static resources when building, resources less than 10240 bytes will be automatically inlined into the bundle product

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
      publicPath: 'https://xxx/'
    }
  }
};
```
At this point, all static resources will be prefixed with `https://xxx/`

### svgr
Packaged to handle svg as a React component, options reference [svgr](https://react-svgr.com/docs/options/), plus support for two configuration items `include` and `exclude` to match the svg file to be handled
- type: `boolean | Object`
- default: `true`

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
``js

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

- type: `false | Object`
- default: `{}`

### tsconfigPath
Path to the tsconfig file
- type: `string`
- default: `. /tsconfig.json`

### distPath
The output path of the dts file, based on [outdir]('/zh/api/build-config/#outdir')
- type: `string`
- default: `. /types`

### only
Generate only dts files, not js files
- type: `boolean`
- default: `false`

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
    }
  }
}

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
    }
  }
}
```

For the `string` type, specify the path to the implementation library for `Less`
```js modern.config.ts
export default {
  buildConfig: {
    style: {
      less: {
        implementation: require.resolve('less'),
      },
    }
  }
}
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
    }
  }
}
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
    }
  }
}
```

For the `string` type, specify the path to the `Sass` implementation library
```js modern.config.ts
export default {
  buildConfig: {
    style: {
      sass: {
        implementation: require.resolve('sass'),
      },
    }
  }
}
```

### postcss
- plugins
- processOptions

See [postcss](https://github.com/postcss/postcss#options) for detailed configuration
### inject
Configure whether to insert style into js in packaged mode

- type: `boolean`
- default: `false`

### autoModules
Enable CSS Modules automatically based on the filename.

- type: `boolean | RegExp`
- default: `true `

`true` : Enables CSS Modules for style files ending with `.module.css` `.module.less` `.module.scss` `.module.sass` filenames

`false` : Disable CSS Modules.

`RegExp` : Enables CSS Modules for all files that match the regular condition.

### modules
CSS Modules configuration

- type: `Object`
- default: `{}`

A common configuration is ``localsConvention``, which changes the class name generation rules for css modules
```js modern.config.ts
export default {
  buildConfig: {
    style: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    }
  }
}
```
For the following styles
```css
.box-title {
  color: red;
}
```
You can use ``styles.boxTitle`` to access


For detailed configuration see [postcss-modules](https://github.com/madyankin/postcss-modules#usage)

### tailwind
tailwindcss related configuration

- type: `Object | Function`
- default: `see configuration details below`

<details>
  <summary>TailwindCSS configuration details</summary>

```js modern.config.ts
  const tailwind = {
    purge: {
        enabled: options.env === 'production',
        content: [
          '. /config/html/**/*.html',
          '. /config/html/**/*.ejs',
          '. /config/html/**/*.hbs',
          '. /src/**/*',
        ],
        layers: ['utilities'],
    },
    // https://tailwindcss.com/docs/upcoming-changes
    future: {
      removeDeprecatedGapUtilities: false,
      purgeLayersByDefault: true,
      defaultLineHeights: false,
      standardFontWeights: false,
    },
  }
```

When the value is of type `Object`, it is merged with the default configuration via `Object.assign`.

When the value is of type `Function`, the object returned by the function is merged with the default configuration via `Object.assign`.

The `theme` property is not allowed, otherwise the build will fail, using [`designSystem`](/zh/api/design-system) as the `Tailwind CSS Theme` configuration.

The rest of the usage is the same as Tailwind CSS: [Quick Portal](https://tailwindcss.com/docs/configuration).


## target
Specify the target environment for the build
- type: `'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'`
- default: `'es2015'`


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
  buildConfig: {
    format: 'umd',
    umdModuleName: 'myLib',
  }
}
```
At this point the umd product will go to mount on `global.myLib`
:::tip
- The module name of the umd product must not conflict with the global variable name.
- Module names should not contain special characters like `-`, `@`, `/`, etc.
:::

Also the function form can take one parameter, which is the output path of the current package file
```js modern.config.ts
export default {
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
}
```
