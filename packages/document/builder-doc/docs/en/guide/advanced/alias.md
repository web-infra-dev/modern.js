# Path Aliases

Path aliases allow developers to define aliases for modules, making it easier to reference them in code. This can be useful when you want to use a short, easy-to-remember name for a module instead of a long, complex path.

For example, if you frequently reference the `src/common/request.ts` module in your project, you can define an alias for it as `@request` and then use `import request from '@request'` in your code instead of writing the full relative path every time. This also allows you to move the module to a different location without needing to update all the import statements in your code.

In Builder, there are two ways to set up path aliases:

- Through the `paths` configuration in `tsconfig.json`.
- Through the [source.alias](/api/config-source.html#sourcealias) configuration.

## Using `tsconfig.json`'s `paths` Configuration

You can configure aliases through the `paths` configuration in `tsconfig.json`, which is the recommended approach in TypeScript projects as it also resolves the TS type issues related to path aliases.

For example:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["./src/common/*"]
    }
  }
}
```

After configuring, if you reference `@common/Foo.tsx` in your code, it will be mapped to the `<project>/src/common/Foo.tsx` path.

:::tip
You can refer to the [TypeScript - paths](https://www.typescriptlang.org/tsconfig#paths) documentation for more details.
:::

## Use `source.alias` Configuration

Builder provides the [source.alias](/api/config-source.html#sourcealias) configuration option, which corresponds to the webpack/Rspack native [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) configuration. You can configure this option using an object or a function.

### Use Cases

Since the `paths` configuration in `tsconfig.json` is written in a static JSON file, it lacks dynamism.

The `source.alias` configuration can address this limitation by allowing you to dynamically set the `source.alias` using JavaScript code, such as based on environment variables.

### Object Usage

You can configure `source.alias` using an object, where the relative paths will be automatically resolved to absolute paths by Builder.

For example:

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

After configuring, if you reference `@common/Foo.tsx` in your code, it will be mapped to the `<project>/src/common/Foo.tsx` path.

### Function Usage

You can also configure `source.alias` as a function, which receives the built-in `alias` object and allows you to modify it.

For example:

```js
export default {
  source: {
    alias: alias => {
      alias['@common'] = './src/common';
      return alias;
    },
  },
};
```

### Priority

The `paths` configuration in `tsconfig.json` takes precedence over the `source.alias` configuration. When a path matches the rules defined in both `paths` and `source.alias`, the value defined in `paths` will be used.

You can adjust the priority of these two options using [source.aliasStrategy](/api/config-source.html#sourcealiasstrategy).
