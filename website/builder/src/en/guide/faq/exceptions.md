# Exceptions

## 'compilation' argument error when webpack compiling?

If the following error occurs when compiling, it is usually caused by installing the wrong version of webpack in the project, or installing multiple versions of webpack:

```bash
TypeError: The 'compilation' argument must be an instance of Compilation
```

The webpack version problem has the following situations:

1. The webpack dependency is directly declared in the project's package.json, and the version range of the webpack that the Builder depends on is different and cannot match the same version.
2. Multiple npm packages installed in the project all depend on webpack, and the webpack version ranges they depend on are different and cannot match the same version.
3. Due to the lock mechanism of the package manager, multiple webpack versions are generated in the lock file.

In the first case, it is recommended to remove the webpack dependency from the project's package.json. Because Builder encapsulates webpack-related capabilities by default, and will pass in the webpack object in the [tools.webpack](/en/api/config-tools.html#tools-webpack) configuration item. Therefore, in most cases, it is not recommended to install additional webpack dependencies in the project.

In the second case, it is recommended to see if you can upgrade an npm package so that its dependent webpack version range is consistent with the Builder. It is also possible to manually unify versions through the ability of the package manager, e.g. using [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) or [pnpm overrides](https ://pnpm.io/package_json#pnpmoverrides).

If it is the third case, you can use the two methods mentioned in the second case, or you can try to delete the lock file and reinstall it to solve it.

:::tip
Deleting the lock file will automatically upgrade the dependency version in the project to the latest version under the specified scope, please test it thoroughly.
:::

## Find ES6+ code in the compiled files?

By default, Builder will not compile files under `node_modules` through `babel-loader` or `ts-loader`. If the npm package introduced by the project contains ES6+ syntax, it will be packaged into the product.

When this happens, you can specify directories or modules that need to be compiled additionally through the [source.include](/en/api/config-source.html#source-include) configuration item.

## Failed import other modules in Monorepo?

For the sake of compilation performance, by default, Builder will not compile files under `node_modules` through `babel-loader` or `ts-loader`, nor will it compile files outside the current project directory.

Through the `source.include` configuration item, you can specify directories or modules that require additional compilation.

For details, see [source.include usage introduction](/en/api/config-source.html#source-include).

## Compile error `You may need additional loader`?

If the following error message is encountered during the compilation process, it means that there are individual files that cannot be compiled correctly.

```bash
Module parse failed: Unexpected token
File was processed with these loaders:
 * some-loader/index.js

You may need an additional loader to handle the result of these loaders.
```

Solution:

- If the `.ts` file outside the current project is referenced, or the `.ts` file under node_modules, please add the [source.include](/en/api/config-source.html#source-include) configuration Items that specify files that require additional compilation.
- If you refer to a file format that is not supported by Builder, please configure the corresponding webpack loader for compilation.

## Find `exports is not defined` runtime error?

If the compilation is succeed, but the `exports is not defined` error appears after opening the page, it is usually because a CommonJS module is compiled by babel.

Under normal circumstances, Builder will not use babel to compile CommonJS modules. If the [source.include](/en/api/config-source.html#source-include) configuration item is used in the project, or the [tools.babel](/en/api/config-tools.html#tools -babel) `addIncludes` method, some CommonJS modules may be added to the babel compilation.

There are two workarounds for this problem:

1. Avoid adding CommonJS modules to babel compilation.
2. Set babel's `sourceType` configuration item to `unambiguous`, for example:

```js
export default {
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
};
```

Setting `sourceType` to `unambiguous` may have some other effects, please refer to [babel official documentation](https://babeljs.io/docs/en/options#sourcetype).

## Compile error "Error: ES Modules may not assign module.exports or exports.\*, Use ESM export syntax"?

If the following error occurs during compilation, it is usually because a CommonJS module is compiled with babel in the project, and the solution is same as the above `exports is not defined` problem.

```bash
Error: ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: 581
```

For more information, please refer to issue: [babel#12731](https://github.com/babel/babel/issues/12731).

## The compilation progress bar is stuck, but there is no Error log in the terminal?

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

## React component state lost after HMR?

Builder uses React's official [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin) capability for component hot update.

When using Fast Refresh, it is required that the component cannot be an anonymous function, otherwise the state of the React component cannot be preserved after hot update.

The following spellings are incorrect:

```js
// wrong spelling 1
export default function () {
  return <div>Hello World</div>;
}

// wrong spelling 2
export default () => <div>Hello World</div>;
```

The correct spelling is:

```js
// Correct spelling 1
export default function MyComponent() {
  return <div>Hello World</div>;
}

// Correct spelling 2
const MyComponent = () => <div>Hello World</div>

export default MyComponent;
```

## The webpack cache does not work?

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

## Tree Shaking does not take effect?

Builder will enable the Tree Shaking function of webpack by default during production construction. Whether Tree Shaking can take effect depends on whether the business code can meet the Tree Shaking conditions of webpack.

If you encounter the problem that Tree Shaking does not take effect, you can check whether the `sideEffects` configuration of the relevant npm package is correct. If you don't know what `sideEffects` is, you can read the following two documents:

- [webpack official documentation - Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/)
- [Tree Shaking Troubleshooting Guide](https://bytedance.feishu.cn/docs/doccn8E1ldDct5uv1EEDQs8Ycwe)

## JavaScript heap out of memory when compiling?

This error indicates that there is a memory overflow problem during the packaging process. In most cases, it is because the packaged content exceeds the default memory limit of Node.js.

In case of OOM issues, the easiest way to fix this is by increasing the memory cap, Node.js provides the `--max-old-space-size` option to set this. You can set this parameter by adding [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions) before the CLI command:

```bash
NODE_OPTIONS=--max_old_space_size=16384 modern build
```

The value of the parameter represents the upper limit of the memory size (MB). Generally, it can be set to `16384` (16GB).

The following parameters are explained in more detail in the official Node.js documentation:

- [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions)
- [--max-old-space-size](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)

In addition to increasing the memory limit, it is also a solution to improve efficiency by enabling some compilation strategies.

## Division in Less file doesn't work?

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

The writing of division in Less can also be modified through configuration items, see [Less - Math](https://lesscss.org/usage/#less-options-math).

## Compile error ‘TypeError: Cannot delete property 'xxx' of #\<Object\>’

This error indicates that a read-only configuration item was deleted during the compilation process. Normally, we do not want any operation to directly modify the incoming configuration when compiling, but it is difficult to restrict the behavior of underlying plugins (such as postcss-loader, etc). If this error occurs, please contact the builder developer and we will need to do something special with that configuration.

The same type of error is also reported:

- 'TypeError: Cannot add property xxx, object is not extensible'
- 'TypeError: Cannot assign to read only property 'xxx' of object '#\<Object\>'
