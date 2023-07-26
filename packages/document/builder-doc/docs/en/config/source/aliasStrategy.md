- **Type:** `'prefer-tsconfig' | 'prefer-alias'`
- **Default:** `'prefer-tsconfig'`

`source.aliasStrategy` is used to control the priority between the `paths` option in `tsconfig.json` and the `alias` option in the bundler.

### prefer-tsconfig

By default, `source.aliasStrategy` is set to `'prefer-tsconfig'`. In this case, both the `paths` option in `tsconfig.json` and the `alias` option in the bundler will take effect, but the `paths` option in tsconfig has a higher priority.

For example, if the following configurations are set at the same time:

- tsconfig paths:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["./src/common-1/*"]
    }
  }
}
```

- `source.alias`:

```ts
export default {
  source: {
    alias: {
      '@common': './src/common-2',
      '@utils': './src/utils',
    },
  },
};
```

Since the tsconfig paths have a higher priority, the following will happen:

- `@common` will use the value defined in tsconfig paths, pointing to `./src/common-1`
- `@utils` will use the value defined in `source.alias`, pointing to `./src/utils`

### prefer-alias

If the value of `source.aliasStrategy` is set to `prefer-alias`, the `paths` option in `tsconfig.json` will only be used to provide TypeScript type definitions and will not affect the bundling result. In this case, the bundler will only read the `alias` option as the path alias.

```ts
export default {
  source: {
    aliasStrategy: 'prefer-alias',
  },
};
```

For example, if the following configurations are set at the same time:

- tsconfig paths:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["./src/common-1/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

- `source.alias`:

```ts
export default {
  source: {
    alias: {
      '@common': './src/common-2',
    },
  },
};
```

Since the tsconfig paths are only used to provide types, only the `@common` alias will be effective, pointing to the `./src/common-2` directory.

In most cases, you don't need to use `prefer-alias`, but you can consider using it if you need to dynamically generate some alias configurations. For example, generating the `alias` option based on environment variables:

```ts
export default {
  source: {
    alias: {
      '@common':
        process.env.NODE_ENV === 'production'
          ? './src/common-prod'
          : './src/common-dev',
    },
  },
};
```
