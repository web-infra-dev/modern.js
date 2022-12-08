# Alias

Alias is a way to specify a short name for a module or a path to a directory or file. This can be useful when you want to use a short, easy-to-remember name for a module instead of a long, complex path.

For example, if you have a file at `src/common/request.ts`, you could create an alias called `@request` for it, so you could import the file like this: `import request from '@request'`. This makes it easier to reference the file in your code, and also allows you to move the file to a different location without having to update all the import statements in your code.

In Builder, you can set aliases in two ways:

- [source.alias](/en/api/config-source.html#source-alias)
- `paths` in `tsconfig.json`

## Using `source.alias` config

[source.alias](/zh/api/config-source.html#source-alias) corresponds to webpack's native [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) config, you can configure it as an object or a function.

First, you can configure it as an object, for example:

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

The relative path in it will be parsed as an absolute path in Builder.

You can also configure it as a function to get the preset `alias` object and modify it, for example:

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

## Using `paths` config in `tsconfig.json`

In addition to `source.alias`, you can also configure it by `paths` in `tsconfig.json`. We recommend to use this way in TypeScript projects, because it can solve type problem of alias path.

For example:

```json
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["./src/common/*"]
    }
  }
}
```

:::tip Priority
The `paths` config has higher priority than `source.alias`.
:::
