- **Type:**

```ts
type BuildCacheConfig =
  | {
      /**
       * Base directory for the filesystem cache.
       */
      cacheDirectory?: string;
    }
  | boolean;
```

- **Default:**

```js
const defaultBuildCacheConfig = {
  cacheDirectory: './node_modules/.cache/webpack',
};
```

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
