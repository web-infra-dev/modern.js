- **Type:**

```ts
type BuildCacheConfig =
  | {
      /**
       * Base directory for the filesystem cache.
       */
      cacheDirectory?: string;
      /**
       * Environment variables that affect build results
       */
      cacheDigest?: Array<string | undefined>;
    }
  | boolean;
```

- **Default:**

```js
const defaultBuildCacheConfig = {
  cacheDirectory: './node_modules/.cache/webpack',
};
```

- **Bundler:** `only support webpack`

Controls the Builder's caching behavior during the build process.

Builder will enable build cache by default to improve the compile speed, the generated cache files are write to the `./node_modules/.cache/webpack` directory by default.

You can configure the cache path with `buildCache`, e.g.

```js
export default {
  performance: {
    buildCache: {
      cacheDirectory: './node_modules/.custom_cache/webpack',
    },
  },
};
```

You can also disable the build cache by setting it to `false`:

```js
export default {
  performance: {
    buildCache: false,
  },
};
```

If there are some environment variables in the current project that will affect the build results, they can be added to cacheDigest:

```js
export default {
  tools: {
    bundlerChain: (chain: any) => {
      if (process.env.APP_ID === 'xxx') {
        chain.resolve.extensions.prepend('.ttp.ts');
      }
  },
  performance: {
    buildCache: {
      cacheDigest: [process.env.APP_ID]
    },
  },
};
```
