- Type: `boolean`
- Default: `false`

Whether to disable TypeScript type checker during compilation.

By default, Builder will run the TypeScript type checker in a separate process during the build process. Its checking logic is consistent with TypeScript's native `tsc` command. You can use `tsconfig.json` or Builder's `tools.tsChecker` config to customize the checking behavior.

### Blocking Compilation

- In development build, type errors will not block the compilation process.
- In production build, type errors will cause the build to fail to ensure the stability of the production code.

### Example

Disable TypeScript type checker:

```js
export default {
  output: {
    disableTsChecker: true,
  },
};
```

Disable type checker in development:

```js
export default {
  output: {
    disableTsChecker: process.env.NODE_ENV === 'development',
  },
};
```

Disable type checker in production:

```js
export default {
  output: {
    disableTsChecker: process.env.NODE_ENV === 'production',
  },
};
```

:::tip
It is not recommended to disable type checker in production, which will reduce the stability of the production code, please use it with caution.
:::
