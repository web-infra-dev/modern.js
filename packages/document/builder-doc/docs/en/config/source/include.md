- **Type:** `Array<string | RegExp>`
- **Default:** `[]`
- **Bundler:** `only support webpack`

In order to maintain faster compilation speed, Builder will not compile JavaScript/TypeScript files under node_modules through `babel-loader` or `ts-loader` by default, as will as the JavaScript/TypeScript files outside the current project directory.

Through the `source.include` config, you can specify directories or modules that need to be compiled by Builder. The usage of `source.include` is consistent with [Rule.include](https://webpack.js.org/configuration/module/#ruleinclude) in webpack, which supports passing in strings or regular expressions to match the module path.

For example:

```ts
import path from 'path';

export default {
  source: {
    include: [path.resolve(__dirname, '../other-dir')],
  },
};
```

:::tip
When using Rspack as the bundler, **all files** will be compiled by default, and at the same time, exclusion through `source.exclude` is not supported.
:::

### Compile Npm Packages

A typical usage scenario is to compile npm packages under node_modules, because some third-party dependencies have ES6+ syntax, which may cause them to fail to run on low-version browsers. You can solve the problem by using this config to specify the dependencies that need to be compiled.

Take `query-string` as an example, you can add the following config:

```ts
import path from 'path';

export default {
  source: {
    include: [
      // Method 1:
      // First get the path of the module by require.resolve
      // Then pass path.dirname to point to the corresponding directory
      path.dirname(require.resolve('query-string')),
      // Method 2:
      // Match by regular expression
      // All paths containing `/node_modules/query-string/` will be matched
      /\/node_modules\/query-string\//,
    ],
  },
};
```

The above two methods match the absolute paths of files using "path prefixes" and "regular expressions" respectively. It is worth noting that all referenced modules in the project will be matched. Therefore, you should avoid using overly loose values for matching to prevent compilation performance issues or compilation errors.

### Compile Sub Dependencies

When you compile an npm package via `source.include`, Builder will only compile the matching module by default, not the **Sub Dependencies** of the module.

Take `query-string` for example, it depends on the `decode-uri-component` package, which also has ES6+ code, so you need to add the `decode-uri-component` package to `source.include` as well.

```ts
export default {
  source: {
    include: [
      /\/node_modules\/query-string\//,
      /\/node_modules\/decode-uri-component\//,
    ],
  },
};
```

### Compile Libraries in Monorepo

When developing in Monorepo, if you need to refer to the source code of other libraries in Monorepo, you can add the corresponding library to `source.include`:

```ts
import path from 'path';

export default {
  source: {
    include: [
      // Method 1:
      // Compile all files in Monorepo's package directory
      path.resolve(__dirname, '../../packages'),

      // Method 2:
      // Compile the source code of a package in Monorepo's package directory
      // This way of writing matches the range more accurately and has less impact on the overall build performance.
      path.resolve(__dirname, '../../packages/xxx/src'),
    ],
  },
};
```

### Compile CommonJS Module

Babel cannot compile CommonJS modules by default, and if you compile a CommonJS module, you may get a runtime error message `exports is not defined`.

When you need to compile a CommonJS module using `source.include`, you can set Babel's `sourceType` configuration to `unambiguous`.

```ts
export default {
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
};
```

Setting `sourceType` to `unambiguous` may have some other effects, please refer to [Babel official documentation](https://babeljs.io/docs/en/options#sourcetype).

### Matching Symlink

If you match a module that is symlinked to the current project, then you need to match the **real path** of the module, not the symlinked path.

For example, if you symlink the `packages/foo` path in Monorepo to the `node_modules/foo` path of the current project, you need to match the `packages/foo` path, not the `node_modules/foo` path.

This behavior can be controlled via webpack's [resolve.symlinks](https://webpack.js.org/configuration/resolve/#resolvesymlinks) config.

### Precautions

Note that `source.include` should not be used to compile the entire `node_modules` directory. For example, the following usage is wrong:

```ts
export default {
  source: {
    include: [/\/node_modules\//],
  },
};
```

If you compile the entire `node_modules`, not only will the build time be greatly increased, but also unexpected errors may occur. Because most of the npm packages in `node_modules` are already compiled, there is usually no need for a second compilation. In addition, exceptions may occur after npm packages such as `core-js` are compiled.
