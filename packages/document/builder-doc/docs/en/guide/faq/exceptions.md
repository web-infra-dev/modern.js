# Exceptions FAQ

### 'compilation' argument error when webpack compiling?

If the following error occurs when compiling, it is usually caused by installing the wrong version of webpack in the project, or installing multiple versions of webpack:

```bash
TypeError: The 'compilation' argument must be an instance of Compilation
```

The webpack version problem has the following situations:

1. The webpack dependency is directly declared in the project's package.json, and the version range of the webpack that the Builder depends on is different and cannot match the same version.
2. Multiple npm packages installed in the project all depend on webpack, and the webpack version ranges they depend on are different and cannot match the same version.
3. Due to the lock mechanism of the package manager, multiple webpack versions are generated in the lock file.

In the first case, it is recommended to remove the webpack dependency from the project's package.json. Because Builder encapsulates webpack-related capabilities by default, and will pass in the webpack object in the [tools.webpack](/en/api/config-tools.html#toolswebpack) configuration option. Therefore, in most cases, it is not recommended to install additional webpack dependencies in the project.

In the second case, it is recommended to see if you can upgrade an npm package so that its dependent webpack version range is consistent with the Builder. It is also possible to manually unify versions through the ability of the package manager, e.g. using [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) or [pnpm overrides](https ://pnpm.io/package_json#pnpmoverrides).

If it is the third case, you can use the two methods mentioned in the second case, or you can try to delete the lock file and reinstall it to solve it.

:::tip
Deleting the lock file will automatically upgrade the dependency version in the project to the latest version under the specified scope, please test it thoroughly.
:::

---

### Find ES6+ code in the compiled files?

By default, Builder will not compile files under `node_modules` through `babel-loader` or `ts-loader`. If the npm package introduced by the project contains ES6+ syntax, it will be bundled into the output files.

When this happens, you can specify directories or modules that need to be compiled additionally through the [source.include](/en/api/config-source.html#sourceinclude) configuration option.

---

### Failed import other modules in Monorepo?

Due to considerations of compilation performance, by default, the Builder does not compile files under `node_modules` or files outside the current project directory.

Therefore, when you reference the source code of other sub-projects, you may encounter an error similar to `You may need an additional loader to handle the result of these loaders.`

There are several solutions to this problem:

1. You can enable the source code build mode to compile other sub-projects within the monorepo. Please refer to [Source Code Build Mode](/guide/advanced/source-build.html) for more information.
2. You can add the `source.include` configuration option to specify the directories or modules that need to be additionally compiled. Please refer to [Usage of source.include](/api/config-source.html#sourceinclude) for more information.
3. You can pre-build the sub-projects that need to be referenced, generate the corresponding build artifacts, and then reference the build artifacts in the current project instead of referencing the source code.

---

### Compile error `Error: [object Object] is not a PostCSS plugin` ?

Currently, Modern.js is using PostCSS v8. If you encounter the `Error: [object Object] is not a PostCSS plugin` error during the compilation process, it is usually caused by referencing the wrong version of PostCSS, for example, the version of `postcss` (peerDependencies) in `cssnano` does not meet expectations.

You can find the dependencies of `UNMET PEER DEPENDENCY` through `npm ls postcss`, and then install the correct version of dependencies by specifying the PostCSS version in package.json.

```
npm ls postcss

 ├─┬ css-loader@6.3.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
 ├─┬ css-minimizer-webpack-plugin@3.0.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
```

---

### Compile error `You may need additional loader`?

If the following error message is encountered during the compilation process, it means that there are individual files that cannot be compiled correctly.

```bash
Module parse failed: Unexpected token
File was processed with these loaders:
 * some-loader/index.js

You may need an additional loader to handle the result of these loaders.
```

Solution:

- If the `.ts` file outside the current project is referenced, or the `.ts` file under node_modules, please add the [source.include](/en/api/config-source.html#sourceinclude) configuration Items that specify files that require additional compilation.
- If you refer to a file format that is not supported by Builder, please configure the corresponding webpack loader for compilation.

---

### Find `exports is not defined` runtime error?

If the compilation is succeed, but the `exports is not defined` error appears after opening the page, it is usually because a CommonJS module is compiled by Babel.

Under normal circumstances, Builder will not use Babel to compile CommonJS modules. If the [source.include](/en/api/config-source.html#sourceinclude) configuration option is used in the project, or the [tools.babel](/en/api/config-tools.html#tools-babel) `addIncludes` method, some CommonJS modules may be added to the Babel compilation.

There are two workarounds for this problem:

1. Avoid adding CommonJS modules to Babel compilation.
2. Set Babel's `sourceType` configuration option to `unambiguous`, for example:

```js
export default {
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
};
```

Setting `sourceType` to `unambiguous` may have some other effects, please refer to [Babel official documentation](https://babeljs.io/docs/en/options#sourcetype).

---

### Compile error "Error: ES Modules may not assign module.exports or exports.\*, Use ESM export syntax"?

If the following error occurs during compilation, it is usually because a CommonJS module is compiled with Babel in the project, and the solution is same as the above `exports is not defined` problem.

```bash
Error: ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: 581
```

For more information, please refer to issue: [babel#12731](https://github.com/babel/babel/issues/12731).

---

### Compilation error "export 'foo' (imported as 'foo') was not found in './utils'"?

If you encounter this error during the compilation process, it means that your code is referencing an export that does not exist.

For example, in the following code, `index.ts` is importing the `foo` variable from `utils.ts`, but `utils.ts` only exports the `bar` variable.

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

In this case, Builder will throw the following error:

```bash
Compile Error:
File: ./src/index.ts
export 'foo' (imported as 'foo') was not found in './utils' (possible exports: bar)
```

If you encounter this issue, the first step is to check the import/export statements in your code and correct any invalid code.

There are some common mistakes:

- Importing a non-existent variable:

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

- Re-exporting a type without adding the `type` modifier, causing compilers like Babel to fail in recognizing the type export, resulting in compilation errors.

```ts
// utils.ts
export type Foo = 'bar';

// index.ts
export { Foo } from './utils'; // Incorrect
export type { Foo } from './utils'; // Correct
```

In some cases, the error may be caused by a third-party dependency that you cannot modify directly. In this situation, if you are sure that the issue does not affect your application, you can add the following configuration to change the log level from `error` to `warn`:

```ts
export default {
  tools: {
    webpackChain(chain) {
      chain.module.parser.merge({
        javascript: {
          exportsPresence: 'warn',
        },
      });
    },
  },
};
```

However, it is important to contact the developer of the third-party dependency immediately to fix the issue.

> You can refer to the webpack documentation for more details on [module.parser.javascript.exportsPresence](https://webpack.js.org/configuration/module/#moduleparserjavascriptexportspresence).

---

### The compilation progress bar is stuck, but there is no Error log in the terminal?

When the compilation progress bar is stuck, but there is no Error log on the terminal, it is usually because an exception occurred during the compilation. In some cases, when Error is caught by webpack or other modules, the error log can not be output correctly. The most common scenario is that there is an exception in the Babel config, which is caught by webpack, and webpack swallows the Error in some cases.

**Solution:**

If this problem occurs after you modify the Babel config, it is recommended to check for the following incorrect usages:

1. You have configured a plugin or preset that does not exist, maybe the name is misspelled, or it is not installed correctly.

```ts
// wrong example
export default {
  tools: {
    babel(config, { addPlugins }) {
      // The plugin has the wrong name or is not installed
      addPlugins('babel-plugin-not-exists');
    },
  },
};
```

2. Whether multiple babel-plugin-imports are configured, but the name of each babel-plugin-import is not declared in the third item of the array.

```ts
// wrong example
export default {
  tools: {
    babel(config, { addPlugins }) {
      addPlugins([
        [
          'babel-plugin-import',
          { libraryName: 'antd', libraryDirectory: 'es' },
        ],
        [
          'babel-plugin-import',
          { libraryName: 'antd-mobile', libraryDirectory: 'es' },
        ],
      ]);
    },
  },
};
```

```ts
// correct example
export default {
  tools: {
    babel(config, { addPlugins }) {
      addPlugins([
        [
          'babel-plugin-import',
          { libraryName: 'antd', libraryDirectory: 'es' },
          'antd',
        ],
        [
          'babel-plugin-import',
          { libraryName: 'antd-mobile', libraryDirectory: 'es' },
          'antd-mobile',
        ],
      ]);
    },
  },
};
```

---

### The webpack cache does not work?

Builder enables webpack's persistent cache by default.

After the first compilation is completed, the cache file will be automatically generated and output to the `./node_modules/.cache/webpack` directory. When the second compilation is performed, the cache is hit and the compilation speed is greatly improved.

When configuration files such as `package.json` are modified, the cache is automatically invalidated.

If the webpack compilation cache in the project has not taken effect, you can add the following configuration for troubleshooting:

```ts
export default {
  tools: {
    webpack(config) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        debug: /webpack\.cache/,
      };
    },
  },
};
```

After adding the above configuration, webpack will output logs for debugging. Please refer to the logs related to `PackFileCacheStrategy` to understand the cause of cache invalidation.

---

### Tree shaking does not take effect?

Builder will enable the tree shaking function of webpack by default during production construction. Whether tree shaking can take effect depends on whether the business code can meet the tree shaking conditions of webpack.

If you encounter the problem that tree shaking does not take effect, you can check whether the `sideEffects` configuration of the relevant npm package is correct. If you don't know what `sideEffects` is, or are interested in the principles behind tree shaking, you can read the following two documents:

- [webpack official documentation - Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/)
- [Tree Shaking Troubleshooting Guide](https://bytedance.feishu.cn/docs/doccn8E1ldDct5uv1EEDQs8Ycwe)

---

### JavaScript heap out of memory when compiling?

This error indicates that there is a memory overflow problem during the packaging process. In most cases, it is because the bundled content exceeds the default memory limit of Node.js.

In case of OOM issues, the easiest way to fix this is by increasing the memory cap, Node.js provides the `--max-old-space-size` option to set this. You can set this parameter by adding [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions) before the CLI command.

For example, add parameters before the `modern build` command:

```diff title="package.json"
{
   "scripts": {
- "build": "modern build"
+ "build": "NODE_OPTIONS=--max_old_space_size=16384 modern build"
   }
}
```

If you are executing other commands, such as `modern deploy`, please add parameters before the corresponding command.

The value of the `max_old_space_size` parameter represents the upper limit of the memory size (MB). Generally, it can be set to `16384` (16GB).

The following parameters are explained in more detail in the official Node.js documentation:

- [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions)
- [--max-old-space-size](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)

In addition to increasing the memory limit, it is also a solution to improve efficiency by enabling some compilation strategies, please refer to [Improve Build Performance](/guide/optimization/build-performance).

If the above methods cannot solve your problem, it may be that some abnormal logic in the project has caused memory overflow. You can debug recent code changes and locate the root cause of problems. If it cannot be located, please contact us.

---

### Can't resolve 'core-js/modules/xxx.js' when compiling?

If you get an error similar to the following when compiling, it means that [core-js](https://github.com/zloirock/core-js) cannot be resolved properly in the project.

```bash
Module not found: Can't resolve 'core-js/modules/es.error.cause.js'
```

Usually, you don't need to install `core-js` in the project, because the Builder already has a built-in `core-js` v3.

If there is an error that `core-js` cannot be found, there may be several reasons:

1. The `plugins` configured by Babel is overwritten in the project, causing the built-in `babelPluginLockCorejsVersion` does not work. In this case, just change `tools.babel` to a function:

```ts
// Wrong usage, will override Builder's default Babel plugins
export default {
  tools: {
    babel: {
      plugins: ['babel-plugin-xxx'],
    },
  },
};

// Correct usage, add a new plugin in the default configuration instead of overriding the plugin
export default {
  tools: {
    babel(config) {
      config.plugins.push('babel-plugin-xxx');
    },
  },
};
```

2. Some code in the project depends on `core-js` v2. In this case, you usually need to find out the corresponding code and upgrade `core-js` to the v3.
3. An npm package in `node_modules` imported `core-js`, but does not declare the `core-js` dependency in `dependencies`. In this case, you need to declare the `core-js` dependency in the corresponding npm package, or install a copy of `core-js` in the project root directory.

---

### Compilation error after referencing a type from lodash

If the `@types/lodash` package is installed in your project, you may import some types from `lodash`, such as the `DebouncedFunc` type:

```ts
import { debounce, DebouncedFunc } from 'lodash';
```

Builder will throw an error after compiling the above code:

```bash
Syntax error: /project/src/index.ts: The lodash method `DebouncedFunc` is not a known module.
Please report bugs to https://github.com/lodash/babel-plugin-lodash/issues.
```

The reason is that Builder has enabled the [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash) plugin by default to optimize the bundle size of lodash, but Babel cannot distinguish between "value" and "type", which resulting in an exception in the compiled code.

The solution is to use TypeScript's `import type` syntax to explicitly declare the `DebouncedFunc` type:

```ts
import { debounce } from 'lodash';
import type { DebouncedFunc } from 'lodash';
```

:::tip
In any case, it is recommended to use `import type` to import types, this will help the compiler to identify the type.
:::

---

### Division in Less file doesn't work?

Compared with the v3 version, the Less v4 version has some differences in the way of writing division:

```less
// Less v3
.math {
  width: 2px / 2; // 1px
  width: 2px ./ 2; // 1px
  width: (2px / 2); // 1px
}

// Less v4
.math {
  width: 2px / 2; // 2px / 2
  width: 2px ./ 2; // 1px
  width: (2px / 2); // 1px
}
```

The built-in Less version of Builder is v4, and the writing method of the lower version will not take effect. Please pay attention to the distinction.

The writing of division in Less can also be modified through configuration options, see [Less - Math](https://lesscss.org/usage/#less-options-math).

---

### Compile error ‘TypeError: Cannot delete property 'xxx' of #\<Object\>’

This error indicates that a read-only configuration option was deleted during the compilation process. Normally, we do not want any operation to directly modify the incoming configuration when compiling, but it is difficult to restrict the behavior of underlying plugins (such as postcss-loader, etc). If this error occurs, please contact the builder developer and we will need to do something special with that configuration.

The same type of error is also reported:

- 'TypeError: Cannot add property xxx, object is not extensible'
- 'TypeError: Cannot assign to read only property 'xxx' of object '#\<Object\>'
