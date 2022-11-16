# Alias

In Builder, you can set aliases in two ways:

- [source.alias](/api/config-source.html#source-alias)
- `paths` in `tsconfig.json`

## By `source.alias`

`source.alias` corresponds to webpack's native `resolve.alias`, you can configure it by object or function.

First, you can configure it by object, for example:

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
    alias: (alias) => {
      alias['@common'] = './src/common';
      return alias;
    },
  },
};
```

## By `paths` in `tsconfig.json`

In addition to `source.alias`, you can also configure it by `paths` in `tsconfig.json`.We recommend to use this way in TS projects, because it can solve type problem of alias path.


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

> The `paths` config has higher priority than `source.alias`.
