- Type: `Record<string, string | string[]> | Function`
- Default: `undefined`

Create aliases to import or require certain modules, same as the [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) config of webpack.

:::tip
For TypeScript projects, you only need to configure [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) in `tsconfig.json`, Builder will automatically recognize the aliases in `tsconfig.json`, so the `alias` config is unnecessary.
:::

#### Object Type

The `alias` can be a Object, and the relative path will be automatically converted to absolute path.

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

With above configuration, if `@common/Foo.tsx` is import in the code, it will be mapped to the `<root>/src/common/Foo.tsx` path.

#### Function Type

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
