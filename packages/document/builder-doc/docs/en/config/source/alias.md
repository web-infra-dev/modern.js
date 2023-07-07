- **Type:** `Record<string, string | string[]> | Function`
- **Default:** `undefined`

Create aliases to import or require certain modules, same as the [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) config of webpack.

:::tip
For TypeScript projects, you only need to configure [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) in `tsconfig.json`, Builder will automatically recognize the aliases in `tsconfig.json`, so the `alias` config is unnecessary.
:::

:::tip
For TypeScript projects, you only need to configure [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) in the `tsconfig.json` file. The Builder will automatically recognize it, so there is no need to configure the `source.alias` option separately. For more details, please refer to [Path Aliases](https://modernjs.dev/builder/en/guide/advanced/alias.html).
:::

### Object Type

The `alias` can be an Object, and the relative path will be automatically converted to absolute path.

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

With above configuration, if `@common/Foo.tsx` is import in the code, it will be mapped to the `<project>/src/common/Foo.tsx` path.

### Function Type

The `alias` can be a function, it will accept the previous alias object, and you can modify it.

```js
export default {
  source: {
    alias: alias => {
      alias['@common'] = './src/common';
    },
  },
};
```

You can also return a new object as the final result in the function, which will replace the previous alias object.

```js
export default {
  source: {
    alias: alias => {
      return {
        '@common': './src/common',
      };
    },
  },
};
```

### Exact Matching

By default, `source.alias` will automatically match sub-paths, for example, with the following configuration:

```js
import path from 'path';

export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

It will match as follows:

```js
import a from '@common'; // resolved to `./src/common`
import b from '@common/util'; // resolved to `./src/common/util`
```

You can add the `$` symbol to enable exact matching, which will not automatically match sub-paths.

```js
import path from 'path';

export default {
  source: {
    alias: {
      '@common$': './src/common',
    },
  },
};
```

It will match as follows:

```js
import a from '@common'; // resolved to `./src/common`
import b from '@common/util'; // remains as `@common/util`
```

### Handling npm packages

You can use `alias` to resolve an npm package to a specific directory.

For example, if multiple versions of the `react` are installed in the project, you can alias `react` to the version installed in the root `node_modules` directory to avoid bundling multiple copies of the React code.

```js
import path from 'path';

export default {
  source: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
    },
  },
};
```

When using alias to handle npm packages, please be aware of whether different major versions of the package are being used in the project.

For example, if a module or npm dependency in your project uses the React 18 API, and you alias React to version 17, the module will not be able to reference the React 18 API, resulting in code exceptions.
