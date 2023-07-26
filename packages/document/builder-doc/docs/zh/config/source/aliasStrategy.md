- **类型：** `'prefer-tsconfig' | 'prefer-alias'`
- **默认值：** `'prefer-tsconfig'`

`source.aliasStrategy` 用于控制 `tsconfig.json` 中的 `paths` 选项与打包工具的 `alias` 选项的优先级。

### prefer-tsconfig

`source.aliasStrategy` 默认为 `'prefer-tsconfig'`，此时 `tsconfig.json` 中的 `paths` 选项和打包工具的 `alias` 选项都会生效，但 tsconfig paths 选项的优先级更高。

比如同时配置以下内容：

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

由于 tsconfig paths 的优先级更高，所以：

- `@common` 会使用 tsconfig paths 定义的值，指向 `./src/common-1`
- `@utils` 会使用 `source.alias` 定义的值，指向 `./src/utils`

### prefer-alias

当 `source.aliasStrategy` 的值为 `prefer-alias` 时，`tsconfig.json` 中的 `paths` 选项只用于提供 TypeScript 类型定义，而不会对打包结果产生任何影响。此时，构建工具只会读取 `alias` 选项作为路径别名。

```ts
export default {
  source: {
    aliasStrategy: 'prefer-alias',
  },
};
```

比如同时配置以下内容：

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

由于 tsconfig paths 只用于提供类型，所以最终只有 `@common` 别名生效，并指向 `./src/common-2` 目录。

大部分情况下你不需要使用 `prefer-alias`，但当你需要动态生成一些别名配置时，可以考虑使用它。比如，基于环境变量来生成 `alias` 选项：

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
